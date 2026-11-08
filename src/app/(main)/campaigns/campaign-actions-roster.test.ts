import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/session', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    inviteCodeLimiter: { check: vi.fn(async () => ({ success: true })) },
  };
});

vi.mock('@/lib/role-policy', () => ({
  getRolePolicyForUser: vi.fn(async () => ({ maxPlayersPerCampaign: 6, role: 'new_player' })),
}));

vi.mock('@/lib/campaign-invite', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/campaign-invite')>();
  return {
    ...actual,
    normalizeInviteCodeInput: (value: string) => value.trim().toUpperCase(),
    isValidInviteCodeFormat: () => true,
  };
});

import { addCharacterToCampaignAction, joinCampaignAction } from './actions';
import { requireAuth } from '@/lib/supabase/session';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const PLAYER = { uid: 'player-1', name: 'Player One' };
const OWNER = { uid: 'owner-1', name: 'RM' };
const CHAR_ID = 'char-11111111-1111-1111-1111-111111111111';

const STORED = {
  name: 'Trusted Hero',
  level: 7,
  portrait: 'https://cdn.test/real.png',
  archetype: { type: 'power' },
  ancestry: { name: 'Riverfolk' },
  visibility: 'private',
};

function forgedExtras() {
  return {
    characterName: 'Forged Spoof',
    portrait: 'https://evil.example/fake.png',
    level: 99,
    species: 'Fake Species',
    archetypeType: 'martial',
  } as const;
}

describe('campaign actions use stored character data, not forged display fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joinCampaignAction ignores extra runtime fields and persists roster from storage', async () => {
    mockRequireAuth.mockResolvedValue(PLAYER);
    let updatedCharacters: unknown[] | null = null;

    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'characters') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { id: CHAR_ID, data: STORED },
                    error: null,
                  })),
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
            })),
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: { username: 'hero' }, error: null })),
              })),
            })),
          };
        }
        throw new Error(table);
      }),
    } as never);

    mockCreateServiceRoleClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'campaigns') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: {
                    id: 'camp-1',
                    owner_id: OWNER.uid,
                    characters: [],
                  },
                  error: null,
                })),
              })),
            })),
            update: vi.fn((payload: { characters: unknown[] }) => {
              updatedCharacters = payload.characters;
              return { eq: vi.fn(async () => ({ error: null })) };
            }),
          };
        }
        if (table === 'campaign_members') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(async () => ({ data: [], error: null })),
            })),
            upsert: vi.fn(async () => ({ error: null })),
          };
        }
        throw new Error(table);
      }),
    } as never);

    const result = await joinCampaignAction({
      inviteCode: 'ABCD2345',
      characterId: CHAR_ID,
      ...forgedExtras(),
    } as { inviteCode: string; characterId: string });

    expect(result.success).toBe(true);
    expect(updatedCharacters).not.toBeNull();
    const entry = (updatedCharacters as unknown as Array<Record<string, unknown>>)[0]!;
    expect(entry.characterName).toBe('Trusted Hero');
    expect(entry.level).toBe(7);
    expect(entry.portrait).toBe('https://cdn.test/real.png');
    expect(entry.species).toBe('Riverfolk');
    expect(entry.archetype).toBe('Power');
    expect(entry.characterName).not.toBe('Forged Spoof');
  });

  it('addCharacterToCampaignAction rejects a non-owner without writing the campaign', async () => {
    mockRequireAuth.mockResolvedValue(PLAYER);
    const update = vi.fn();
    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'campaigns') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: { id: 'camp-1', owner_id: OWNER.uid, characters: [] },
                  error: null,
                })),
              })),
            })),
            update,
          };
        }
        throw new Error(table);
      }),
    } as never);

    const result = await addCharacterToCampaignAction({
      campaignId: 'camp-1',
      characterId: CHAR_ID,
      ...forgedExtras(),
    } as { campaignId: string; characterId: string });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Realm Master/i);
    expect(update).not.toHaveBeenCalled();
  });

  it('addCharacterToCampaignAction persists roster fields from the stored character for the owner', async () => {
    mockRequireAuth.mockResolvedValue(OWNER);
    let campaignUpdatePayload: unknown;
    const campaignUpdate = vi.fn((payload: unknown) => {
      campaignUpdatePayload = payload;
      return { eq: vi.fn(async () => ({ error: null })) };
    });

    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'campaigns') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: { id: 'camp-1', owner_id: OWNER.uid, characters: [] },
                  error: null,
                })),
              })),
            })),
            update: campaignUpdate,
          };
        }
        if (table === 'characters') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { id: CHAR_ID, data: STORED },
                    error: null,
                  })),
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(async () => ({ error: null })),
              })),
            })),
          };
        }
        if (table === 'campaign_members') {
          return { upsert: vi.fn(async () => ({ error: null })) };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: { username: 'rm' }, error: null })),
              })),
            })),
          };
        }
        throw new Error(table);
      }),
    } as never);

    const result = await addCharacterToCampaignAction({
      campaignId: 'camp-1',
      characterId: CHAR_ID,
      ...forgedExtras(),
    } as { campaignId: string; characterId: string });

    expect(result.success).toBe(true);
    expect(campaignUpdate).toHaveBeenCalled();
    const payload = campaignUpdatePayload as { characters: Array<Record<string, unknown>> };
    const entry = payload.characters[0]!;
    expect(entry.characterName).toBe('Trusted Hero');
    expect(entry.level).toBe(7);
    expect(entry.archetype).toBe('Power');
  });
});
