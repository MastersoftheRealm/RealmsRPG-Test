import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/character-view-enrichment-server', () => ({
  getOwnerLibraryAndEnrichmentForView: vi.fn(),
}));

import { GET } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { emptyCharacterViewEnrichment } from '@/lib/character-view-enrichment';
import { getOwnerLibraryAndEnrichmentForView } from '@/lib/character-view-enrichment-server';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
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
  visibility?: string | null | undefined;
};

type CampaignRow = {
  id: string;
  owner_id: string;
  characters: unknown;
};

function makeCharacterRow(
  overrides: Partial<CharacterRow['data']> = {},
  columnVisibility: CharacterRow['visibility'] = 'campaign',
): CharacterRow {
  const dataVisibility =
    typeof overrides.visibility === 'string' ? overrides.visibility : columnVisibility;
  return {
    id: CHARACTER_ID,
    user_id: PLAYER.uid,
    data: {
      name: 'Roster Hero',
      level: 2,
      visibility: dataVisibility,
      abilities: { agility: 2, vitality: 1, acuity: 0 },
      health: { max: 20, current: 15 },
      energy: { max: 10, current: 8 },
      actionPoints: 3,
      ...overrides,
    },
    created_at: '2026-07-01T12:00:00.000Z',
    updated_at: '2026-07-01T12:00:00.000Z',
    visibility: columnVisibility,
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
  viewerId,
  campaignRow,
  memberUserIds = [],
  characterRow = null,
}: {
  viewerId: string;
  campaignRow: CampaignRow | null;
  memberUserIds?: string[] | undefined;
  characterRow?: CharacterRow | null | undefined;
}) {
  return {
    rpc: vi.fn(async (name: string, args: Record<string, string>) => {
      if (name === 'get_campaign_character_relational_document') {
        if (!campaignRow) return { data: { status: 'campaign_not_found' }, error: null };
        if (viewerId !== campaignRow.owner_id && !memberUserIds.includes(viewerId)) {
          return { data: { status: 'not_member' }, error: null };
        }
        const characterOwnerId = String(args.p_character_owner_id ?? '');
        if (
          characterOwnerId !== campaignRow.owner_id &&
          !memberUserIds.includes(characterOwnerId)
        ) {
          return { data: { status: 'character_not_rostered' }, error: null };
        }
        const roster = campaignRow.characters as Array<{
          userId: string;
          characterId: string;
        }>;
        if (
          !roster.some(
            (entry) =>
              entry.userId === args.p_character_owner_id &&
              entry.characterId === args.p_character_id,
          )
        ) {
          return { data: { status: 'character_not_rostered' }, error: null };
        }
        if (!characterRow) return { data: { status: 'character_not_found' }, error: null };
        const visibility = characterRow.visibility ?? 'private';
        if (
          visibility === 'private' &&
          viewerId !== characterRow.user_id &&
          viewerId !== campaignRow.owner_id
        ) {
          return { data: { status: 'private' }, error: null };
        }
        return {
          data: {
            status: 'ok',
            character: {
              ...characterRow.data,
              id: characterRow.id,
              userId: characterRow.user_id,
              createdAt: characterRow.created_at,
              updatedAt: characterRow.updated_at,
              visibility,
            },
          },
          error: null,
        };
      }
      throw new Error(`Unexpected RPC: ${name}`);
    }),
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
      if (table === 'core_rules') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'PROGRESSION_PLAYER',
                data: { baseHealth: 20 },
              },
              {
                id: 'PROGRESSION_CREATURE',
                data: { baseHitEnergyPool: 30 },
              },
            ],
            error: null,
          }),
        };
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
  memberUserIds?: string[] | undefined;
  characterRow?: CharacterRow | null | undefined;
}) {
  mockGetSession.mockResolvedValue({ user: args.user, error: null });
  const supabase = createMockSupabase({
    viewerId: args.user.uid,
    campaignRow: makeCampaignRow(),
    memberUserIds: args.memberUserIds ?? [MEMBER.uid, PLAYER.uid],
    characterRow: args.characterRow === undefined ? makeCharacterRow() : args.characterRow,
  });
  mockCreateClient.mockResolvedValue(supabase as never);
  return supabase;
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

  it('returns 401 before query validation when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const url = new URL(
      `http://localhost/api/campaigns/${CAMPAIGN_ID}/characters/${PLAYER.uid}/${CHARACTER_ID}`,
    );
    url.searchParams.set('scope', 'not-a-valid-scope');
    const response = await GET(new NextRequest(url), routeParams());

    expect(response.status).toBe(401);
  });

  it('returns the full sheet to a campaign member when visibility is campaign (86e39knu2)', async () => {
    const supabase = stubAuthedClient({ user: MEMBER });

    const response = await GET(makeGetRequest(), routeParams());

    expect(response.status).toBe(200);
    const body = await readJson<{ visibility: string }>(response);
    expect(body.visibility).toBe('campaign');
    expect(supabase.rpc).toHaveBeenCalledOnce();
    expect(supabase.rpc).toHaveBeenCalledWith('get_campaign_character_relational_document', {
      p_campaign_id: CAMPAIGN_ID,
      p_character_owner_id: PLAYER.uid,
      p_character_id: CHARACTER_ID,
    });
    expect(mockGetOwnerLibraryAndEnrichmentForView).toHaveBeenCalled();
  });

  it('uses the visibility column over stale JSON on full sheet (86e39knu2)', async () => {
    stubAuthedClient({
      user: MEMBER,
      characterRow: makeCharacterRow({ visibility: 'campaign' }, 'private'),
    });

    const response = await GET(makeGetRequest(), routeParams());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({
      error: 'This character is set to private and cannot be viewed',
    });
  });

  it('returns the full private sheet to the Realm Master (86e39knu2)', async () => {
    stubAuthedClient({
      user: RM,
      characterRow: makeCharacterRow({ visibility: 'private' }, 'private'),
    });

    const response = await GET(makeGetRequest(), routeParams());

    expect(response.status).toBe(200);
    expect(mockGetOwnerLibraryAndEnrichmentForView).toHaveBeenCalled();
  });

  it('returns 404 when roster JSON still lists a user who left the campaign (API-003)', async () => {
    mockGetSession.mockResolvedValue({ user: MEMBER, error: null });
    const supabase = createMockSupabase({
      viewerId: MEMBER.uid,
      campaignRow: makeCampaignRow(),
      memberUserIds: [MEMBER.uid],
      characterRow: makeCharacterRow(),
    });
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await GET(makeGetRequest(), routeParams());

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({
      error: 'Character not found in campaign',
    });
    expect(mockGetOwnerLibraryAndEnrichmentForView).not.toHaveBeenCalled();
  });

  it('returns 403 when a non-member requests the full sheet', async () => {
    stubAuthedClient({ user: STRANGER, memberUserIds: [MEMBER.uid, PLAYER.uid] });

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
      expect.objectContaining(row.data),
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

  it('uses the visibility column over stale JSON on encounter scope (86e39knu2)', async () => {
    stubAuthedClient({
      user: MEMBER,
      characterRow: makeCharacterRow({ visibility: 'campaign' }, 'private'),
    });

    const response = await GET(makeGetRequest('encounter'), routeParams());

    expect(response.status).toBe(403);
  });

  it('does not return private character stats to another campaign member (86e3jryyv)', async () => {
    stubAuthedClient({
      user: MEMBER,
      characterRow: makeCharacterRow({ visibility: 'private' }, 'private'),
    });

    const response = await GET(makeGetRequest('encounter'), routeParams());

    expect(response.status).toBe(403);
    await expect(readJson(response)).resolves.toEqual({
      error: 'This character is set to private and cannot be viewed',
    });
  });

  it('still returns private encounter stats to the Realm Master and the owner', async () => {
    stubAuthedClient({
      user: RM,
      characterRow: makeCharacterRow({ visibility: 'private' }),
    });
    const asRm = await GET(makeGetRequest('encounter'), routeParams());
    expect(asRm.status).toBe(200);

    stubAuthedClient({
      user: PLAYER,
      memberUserIds: [MEMBER.uid, PLAYER.uid],
      characterRow: makeCharacterRow({ visibility: 'private' }),
    });
    const asOwner = await GET(makeGetRequest('encounter'), routeParams());
    expect(asOwner.status).toBe(200);
  });

  it('fills a missing health max from core_rules baseHealth (86e3jtugd)', async () => {
    stubAuthedClient({
      user: MEMBER,
      characterRow: makeCharacterRow({
        level: 1,
        abilities: { vitality: 0 },
        healthPoints: 0,
        health: { current: 4 },
        energy: { current: 0 },
      }),
    });

    const response = await GET(makeGetRequest('encounter'), routeParams());
    expect(response.status).toBe(200);
    const body = await readJson<{ health: { max: number } }>(response);
    expect(body.health.max).toBe(20);
  });
});
