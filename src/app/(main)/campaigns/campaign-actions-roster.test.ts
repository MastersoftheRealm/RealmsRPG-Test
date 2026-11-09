import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/session', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/character-persistence-server', () => ({
  getRelationalCharacterDocument: vi.fn(),
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
import { getRelationalCharacterDocument } from '@/lib/character-persistence-server';

const mockRequireAuth = vi.mocked(requireAuth);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockGetRelationalCharacterDocument = vi.mocked(getRelationalCharacterDocument);

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
  updatedAt: '2026-01-01T00:00:00.000Z',
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

function rosterEntryFromRpcArgs(args: Record<string, unknown>): Record<string, unknown> {
  const raw = args.p_roster_entry;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

describe('campaign actions use stored character data, not forged display fields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRelationalCharacterDocument.mockResolvedValue(STORED as never);
  });

  it('joinCampaignAction ignores extra runtime fields and persists roster from storage', async () => {
    mockRequireAuth.mockResolvedValue(PLAYER);
    let rpcRosterEntry: Record<string, unknown> | null = null;

    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'characters') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { id: CHAR_ID },
                    error: null,
                  })),
                })),
              })),
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
          };
        }
        if (table === 'campaign_members') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(async () => ({ data: [], error: null })),
            })),
          };
        }
        throw new Error(table);
      }),
      rpc: vi.fn(async (_name: string, args: Record<string, unknown>) => {
        rpcRosterEntry = rosterEntryFromRpcArgs(args);
        return {
          data: { status: 'updated', campaignId: 'camp-1', visibilityUpdated: true },
          error: null,
        };
      }),
    } as never);

    const result = await joinCampaignAction({
      inviteCode: 'ABCD2345',
      characterId: CHAR_ID,
      ...forgedExtras(),
    } as { inviteCode: string; characterId: string });

    expect(result.success).toBe(true);
    expect(rpcRosterEntry).not.toBeNull();
    expect(rpcRosterEntry!.characterName).toBe('Trusted Hero');
    expect(rpcRosterEntry!.level).toBe(7);
    expect(rpcRosterEntry!.portrait).toBe('https://cdn.test/real.png');
    expect(rpcRosterEntry!.species).toBe('Riverfolk');
    expect(rpcRosterEntry!.archetype).toBe('Power');
    expect(rpcRosterEntry!.characterName).not.toBe('Forged Spoof');
  });

  it('addCharacterToCampaignAction rejects a non-owner without writing the campaign', async () => {
    mockRequireAuth.mockResolvedValue(PLAYER);
    const rpc = vi.fn();
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
          };
        }
        throw new Error(table);
      }),
    } as never);
    mockCreateServiceRoleClient.mockReturnValue({ rpc } as never);

    const result = await addCharacterToCampaignAction({
      campaignId: 'camp-1',
      characterId: CHAR_ID,
      ...forgedExtras(),
    } as { campaignId: string; characterId: string });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Realm Master/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('addCharacterToCampaignAction persists roster fields from the stored character for the owner', async () => {
    mockRequireAuth.mockResolvedValue(OWNER);
    let rpcRosterEntry: Record<string, unknown> | null = null;
    const rpc = vi.fn(async (_name: string, args: Record<string, unknown>) => {
      rpcRosterEntry = rosterEntryFromRpcArgs(args);
      return { data: { status: 'updated', visibilityUpdated: false }, error: null };
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
          };
        }
        if (table === 'characters') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: { id: CHAR_ID },
                    error: null,
                  })),
                })),
              })),
            })),
          };
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

    mockCreateServiceRoleClient.mockReturnValue({ rpc } as never);

    const result = await addCharacterToCampaignAction({
      campaignId: 'camp-1',
      characterId: CHAR_ID,
      ...forgedExtras(),
    } as { campaignId: string; characterId: string });

    expect(result.success).toBe(true);
    expect(rpc).toHaveBeenCalledWith(
      'add_campaign_character_relational',
      expect.objectContaining({ p_character_id: CHAR_ID }),
    );
    expect(rpcRosterEntry!.characterName).toBe('Trusted Hero');
    expect(rpcRosterEntry!.level).toBe(7);
    expect(rpcRosterEntry!.archetype).toBe('Power');
  });
});
