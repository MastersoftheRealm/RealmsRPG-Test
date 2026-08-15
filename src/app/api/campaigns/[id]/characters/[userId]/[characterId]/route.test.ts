import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/character-view-enrichment-server', () => ({
  getOwnerLibraryAndEnrichmentForView: vi.fn(),
}));

import { GET } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { emptyCharacterViewEnrichment } from '@/lib/character-view-enrichment';
import { getOwnerLibraryAndEnrichmentForView } from '@/lib/character-view-enrichment-server';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockGetOwnerLibraryAndEnrichmentForView = vi.mocked(getOwnerLibraryAndEnrichmentForView);

const RM = { uid: 'rm-user', email: 'rm@example.com' };
const MEMBER = { uid: 'member-user', email: 'member@example.com' };
const STRANGER = { uid: 'stranger-user', email: 'stranger@example.com' };
const PLAYER = { uid: 'player-user', email: 'player@example.com' };

const CAMPAIGN_ID = 'camp-1';
const CHARACTER_ID = 'char-1';

const EMPTY_LIBRARY_FOR_VIEW = {
  powers: [],
  techniques: [],
  items: [],
  creatures: [],
};

type CharacterRow = {
  id: string;
  user_id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type CampaignRow = {
  id: string;
  owner_id: string;
  characters: unknown;
};

function makeCharacterRow(overrides: Partial<CharacterRow['data']> = {}): CharacterRow {
  return {
    id: CHARACTER_ID,
    user_id: PLAYER.uid,
    data: {
      name: 'Roster Hero',
      level: 2,
      visibility: 'campaign',
      abilities: { agility: 2, vitality: 1, acuity: 0 },
      health: { max: 20, current: 15 },
      energy: { max: 10, current: 8 },
      actionPoints: 3,
      ...overrides,
    },
    created_at: '2026-07-01T12:00:00.000Z',
    updated_at: '2026-07-01T12:00:00.000Z',
  };
}

function makeCampaignRow(): CampaignRow {
  return {
    id: CAMPAIGN_ID,
    owner_id: RM.uid,
    characters: [{ userId: PLAYER.uid, characterId: CHARACTER_ID, characterName: 'Roster Hero' }],
  };
}

function createMockSupabase({
  campaignRow,
  memberUserIds = [],
  characterRow = null,
}: {
  campaignRow: CampaignRow | null;
  memberUserIds?: string[];
  characterRow?: CharacterRow | null;
}) {
  return {
    from: vi.fn((table: string) => {
      if (table === 'campaigns') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: campaignRow, error: null }),
            }),
          }),
        };
      }
      if (table === 'campaign_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: memberUserIds.map((user_id) => ({ user_id })),
              error: null,
            }),
          }),
        };
      }
      if (table === 'characters') {
        const eqCalls: [string, string][] = [];
        const chain = {
          eq: vi.fn((col: string, val: string) => {
            eqCalls.push([col, val]);
            return chain;
          }),
          maybeSingle: vi.fn(async () => {
            if (!characterRow) return { data: null, error: null };
            const filters = Object.fromEntries(eqCalls);
            if (filters.id && filters.id !== characterRow.id) {
              return { data: null, error: null };
            }
            if (filters.user_id && filters.user_id !== characterRow.user_id) {
              return { data: null, error: null };
            }
            return { data: characterRow, error: null };
          }),
        };
        return { select: vi.fn(() => chain) };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

function makeGetRequest(scope?: 'encounter') {
  const url = new URL(
    `http://localhost/api/campaigns/${CAMPAIGN_ID}/characters/${PLAYER.uid}/${CHARACTER_ID}`,
  );
  if (scope) url.searchParams.set('scope', scope);
  return new NextRequest(url);
}

function routeParams() {
  return {
    params: Promise.resolve({
      id: CAMPAIGN_ID,
      userId: PLAYER.uid,
      characterId: CHARACTER_ID,
    }),
  };
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

function stubAuthedClient(args: {
  user: { uid: string; email: string };
  memberUserIds?: string[];
  characterRow?: CharacterRow | null;
}) {
  mockGetSession.mockResolvedValue({ user: args.user, error: null });
  const supabase = createMockSupabase({
    campaignRow: makeCampaignRow(),
    memberUserIds: args.memberUserIds ?? [MEMBER.uid],
    characterRow: args.characterRow === undefined ? makeCharacterRow() : args.characterRow,
  });
  mockCreateClient.mockResolvedValue(supabase as never);
  mockCreateServiceRoleClient.mockReturnValue(supabase as never);
}

describe('GET /api/campaigns/[id]/characters/[userId]/[characterId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwnerLibraryAndEnrichmentForView.mockResolvedValue({
      libraryForView: EMPTY_LIBRARY_FOR_VIEW,
      enrichment: emptyCharacterViewEnrichment(),
    });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET(makeGetRequest(), routeParams());

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(mockGetOwnerLibraryAndEnrichmentForView).not.toHaveBeenCalled();
  });

  it('returns 403 when a non-RM member requests the full sheet', async () => {
    stubAuthedClient({ user: MEMBER });

    const response = await GET(makeGetRequest(), routeParams());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({
      error: 'Only the Realm Master can view player character sheets',
    });
    expect(mockGetOwnerLibraryAndEnrichmentForView).not.toHaveBeenCalled();
  });

  it('returns 403 when a non-member requests the full sheet', async () => {
    stubAuthedClient({ user: STRANGER, memberUserIds: [MEMBER.uid] });

    const response = await GET(makeGetRequest(), routeParams());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({
      error: 'You are not in this campaign',
    });
    expect(mockGetOwnerLibraryAndEnrichmentForView).not.toHaveBeenCalled();
  });

  it('returns libraryForView and enrichment on the full RM GET', async () => {
    const row = makeCharacterRow();
    stubAuthedClient({ user: RM, characterRow: row });

    const response = await GET(makeGetRequest(), routeParams());

    expect(response.status).toBe(200);
    const body = await readJson<{
      id: string;
      name: string;
      libraryForView: unknown;
      enrichment: unknown;
    }>(response);
    expect(body.id).toBe(CHARACTER_ID);
    expect(body.name).toBe('Roster Hero');
    expect(body.libraryForView).toEqual(EMPTY_LIBRARY_FOR_VIEW);
    expect(body.enrichment).toEqual(emptyCharacterViewEnrichment());
    expect(mockGetOwnerLibraryAndEnrichmentForView).toHaveBeenCalledWith(
      expect.anything(),
      PLAYER.uid,
      row.data,
    );
  });

  it('omits libraryForView and enrichment on ?scope=encounter', async () => {
    stubAuthedClient({ user: MEMBER });

    const response = await GET(makeGetRequest('encounter'), routeParams());

    expect(response.status).toBe(200);
    const body = await readJson<Record<string, unknown>>(response);
    expect(body).not.toHaveProperty('libraryForView');
    expect(body).not.toHaveProperty('enrichment');
    expect(body.name).toBe('Roster Hero');
    expect(body.currentHealth).toBe(15);
    expect(body.currentEnergy).toBe(8);
    expect(body.actionPoints).toBe(3);
    expect(mockGetOwnerLibraryAndEnrichmentForView).not.toHaveBeenCalled();
  });
});
