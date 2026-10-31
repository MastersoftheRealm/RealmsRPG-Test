import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/public-client', () => ({
  createPublicClient: vi.fn(),
}));

vi.mock('@/lib/supabase/cached-public-read', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/supabase/cached-public-read')>();
  return {
    ...actual,
    readCachedPublicDataWhenValid: vi.fn(
      async (
        _keyParts: string[],
        _tags: string[],
        _revalidate: number,
        loader: () => Promise<unknown>,
      ) => loader(),
    ),
  };
});

vi.mock('@/lib/character-view-enrichment-server', () => ({
  getOwnerLibraryAndEnrichmentForView: vi.fn(),
}));

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    standardLimiter: {
      check: vi.fn(() =>
        Promise.resolve({ success: true, remaining: 29, reset: Date.now() + 60_000 }),
      ),
    },
  };
});

vi.mock('@/lib/character-save', () => ({
  prepareCharacterForSave: vi.fn((data: unknown) => data),
}));

vi.mock('@/lib/character-list-columns', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/character-list-columns')>();
  return {
    ...actual,
    getCharacterListColumns: vi.fn(() => ({})),
  };
});

vi.mock('@/lib/game/archetype-display', () => ({
  fetchArchetypeNameMap: vi.fn(() => Promise.resolve(new Map())),
}));

import { GET, PATCH, DELETE } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public-client';
import { emptyCharacterViewEnrichment } from '@/lib/character-view-enrichment';
import { getOwnerLibraryAndEnrichmentForView } from '@/lib/character-view-enrichment-server';
import { standardLimiter } from '@/lib/rate-limit';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockCreatePublicClient = vi.mocked(createPublicClient);
const mockGetOwnerLibraryAndEnrichmentForView = vi.mocked(getOwnerLibraryAndEnrichmentForView);
const mockStandardLimiterCheck = vi.mocked(standardLimiter.check);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };
const OTHER = { uid: 'other-user', email: 'other@example.com' };

type CharacterRow = {
  id: string;
  user_id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  visibility?: string | null | undefined;
};

function makeCharacterRow(
  id: string,
  userId: string,
  overrides: Partial<CharacterRow['data']> = {},
  column?: { visibility?: string | null | undefined },
): CharacterRow {
  const data = { name: 'Test Hero', level: 1, visibility: 'private', ...overrides };
  return {
    id,
    user_id: userId,
    data,
    created_at: '2026-07-01T12:00:00.000Z',
    updated_at: '2026-07-01T12:00:00.000Z',
    visibility: column && 'visibility' in column ? column.visibility : (data.visibility as string),
  };
}

function createMockSupabase(characterRow: CharacterRow | null) {
  const buildSelectChain = () => {
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
    return chain;
  };

  const lastUpdate: { payload: Record<string, unknown> | null } = { payload: null };

  const buildUpdateChain = (payload: Record<string, unknown>) => {
    lastUpdate.payload = payload;
    const eqCalls: [string, string][] = [];
    const chain = {
      eq: vi.fn((col: string, val: string) => {
        eqCalls.push([col, val]);
        return chain;
      }),
      select: vi.fn(() => chain),
      maybeSingle: vi.fn(async () => {
        if (!characterRow) return { data: null, error: null };
        const filters = Object.fromEntries(eqCalls);
        if (filters.id && filters.id !== characterRow.id) {
          return { data: null, error: null };
        }
        if (filters.user_id && filters.user_id !== characterRow.user_id) {
          return { data: null, error: null };
        }
        if (filters.updated_at && filters.updated_at !== characterRow.updated_at) {
          return { data: null, error: null };
        }
        return {
          data: {
            id: characterRow.id,
            updated_at: (payload.updated_at as string | undefined) ?? '2026-08-14T00:00:00.000Z',
          },
          error: null,
        };
      }),
    };
    return chain;
  };

  const update = vi.fn((payload: Record<string, unknown>) => buildUpdateChain(payload));
  const removePortrait = vi.fn().mockResolvedValue({ error: null });

  const client = {
    lastUpdate,
    update,
    removePortrait,
    from: vi.fn((table: string) => {
      if (table === 'characters') {
        return {
          select: vi.fn(() => buildSelectChain()),
          update,
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
        };
      }
      if (table === 'campaign_members' || table === 'campaigns') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      if (table === 'core_rules') {
        return {
          select: vi.fn().mockResolvedValue({
            data: [{ id: 'PROGRESSION_PLAYER', data: {} }],
            error: null,
          }),
        };
      }
      if (table === 'codex_feats') {
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      }
      if (table === 'codex_skills') {
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
    storage: {
      from: vi.fn(() => ({
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        remove: removePortrait,
      })),
    },
  };

  mockCreatePublicClient.mockReturnValue(client as never);
  return client;
}

function makeGetRequest(id: string) {
  return new NextRequest(`http://localhost/api/characters/${id}`);
}

function makePatchRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost/api/characters/${id}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.1',
      origin: 'http://localhost',
    },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(id: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/characters/${id}`, {
    method: 'DELETE',
    headers: { 'x-forwarded-for': '203.0.113.1', origin: 'http://localhost', ...headers },
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/characters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOwnerLibraryAndEnrichmentForView.mockResolvedValue({
      libraryForView: {
        powers: [],
        techniques: [],
        items: [],
        creatures: [],
      },
      enrichment: emptyCharacterViewEnrichment(),
    });
  });

  it('returns 404 null for a nonexistent character id', async () => {
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(null) as never);

    const response = await GET(makeGetRequest('missing-char-id'), {
      params: Promise.resolve({ id: 'missing-char-id' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
  });

  it('returns 404 null for another users private character (not 403)', async () => {
    const row = makeCharacterRow('char-private', OWNER.uid, { visibility: 'private' });
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('char-private'), {
      params: Promise.resolve({ id: 'char-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
  });

  it('returns 404 null for unauthenticated viewers of a private character (not 403)', async () => {
    const row = makeCharacterRow('char-private', OWNER.uid, { visibility: 'private' });
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('char-private'), {
      params: Promise.resolve({ id: 'char-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
  });

  it('returns the character for the owner', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid, { visibility: 'private' });
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('char-owned'), {
      params: Promise.resolve({ id: 'char-owned' }),
    });

    expect(response.status).toBe(200);
    const body = await readJson<{ character: { id: string; name: string } }>(response);
    expect(body.character.id).toBe('char-owned');
    expect(body.character.name).toBe('Test Hero');
    expect(mockGetOwnerLibraryAndEnrichmentForView).not.toHaveBeenCalled();
  });

  it('returns public characters to non-owner viewers', async () => {
    const row = makeCharacterRow('char-public', OWNER.uid, { visibility: 'public' });
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);
    mockGetOwnerLibraryAndEnrichmentForView.mockResolvedValue({
      libraryForView: {
        powers: [],
        techniques: [],
        items: [],
        creatures: [],
      },
      enrichment: emptyCharacterViewEnrichment(),
    });

    const response = await GET(makeGetRequest('char-public'), {
      params: Promise.resolve({ id: 'char-public' }),
    });

    expect(response.status).toBe(200);
    const body = await readJson<{
      character: { id: string };
      libraryForView: unknown;
      enrichment: unknown;
    }>(response);
    expect(body.character.id).toBe('char-public');
    expect(body.libraryForView).toEqual({ powers: [], techniques: [], items: [], creatures: [] });
    expect(body.enrichment).toEqual(emptyCharacterViewEnrichment());
  });

  it('scopes the owner library to the ids the public character references', async () => {
    const row = makeCharacterRow('char-public', OWNER.uid, {
      visibility: 'public',
      powers: [{ id: 'power-1', name: 'Firebolt' }],
      techniques: [{ id: 'technique-1', name: 'Riposte' }],
      equipment: { weapons: [{ id: 'item-1', name: 'Sword' }] },
    });
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    await GET(makeGetRequest('char-public'), { params: Promise.resolve({ id: 'char-public' }) });

    expect(mockGetOwnerLibraryAndEnrichmentForView).toHaveBeenCalledWith(
      expect.anything(),
      OWNER.uid,
      row.data,
    );
  });

  it('returns 404 for campaign visibility when the viewer is not in a shared campaign roster (86e39knu2)', async () => {
    const row = makeCharacterRow(
      'char-campaign-only',
      OWNER.uid,
      { visibility: 'campaign' },
      { visibility: 'campaign' },
    );
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('char-campaign-only'), {
      params: Promise.resolve({ id: 'char-campaign-only' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
    expect(mockGetOwnerLibraryAndEnrichmentForView).not.toHaveBeenCalled();
  });

  it('returns 404 when the visibility column is private even if the blob says public', async () => {
    const row = makeCharacterRow(
      'char-desync',
      OWNER.uid,
      { visibility: 'public' },
      { visibility: 'private' },
    );
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await GET(makeGetRequest('char-desync'), {
      params: Promise.resolve({ id: 'char-desync' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toBeNull();
    expect(mockGetOwnerLibraryAndEnrichmentForView).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/characters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await PATCH(makePatchRequest('char-1', { name: 'Updated Hero' }), {
      params: Promise.resolve({ id: 'char-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when another user tries to update a character (IDOR)', async () => {
    const row = makeCharacterRow('char-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await PATCH(makePatchRequest('char-private', { name: 'Stolen' }), {
      params: Promise.resolve({ id: 'char-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Character not found' });
  });

  it('updates the character for the owner', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);

    const response = await PATCH(makePatchRequest('char-owned', { name: 'Updated Hero' }), {
      params: Promise.resolve({ id: 'char-owned' }),
    });

    expect(response.status).toBe(200);
    const body = await readJson<{ ok: boolean; updatedAt: string }>(response);
    expect(body.ok).toBe(true);
    expect(body.updatedAt).toBeTruthy();
  });

  it('merges a partial payload and leaves omitted keys intact', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid, { notes: 'keep me', level: 3 });
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);
    const response = await PATCH(makePatchRequest('char-owned', { name: 'Updated Hero' }), {
      params: Promise.resolve({ id: 'char-owned' }),
    });

    expect(response.status).toBe(200);
    expect(supabase.update).toHaveBeenCalled();
    const payload = supabase.lastUpdate.payload;
    expect(payload).toBeTruthy();
    const data = payload!.data as Record<string, unknown>;
    expect(data.name).toBe('Updated Hero');
    expect(data.notes).toBe('keep me');
    expect(data.level).toBe(3);
    expect(typeof data.updatedAt).toBe('string');
  });

  it('returns 409 and does not write when updatedAt is stale', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);
    const response = await PATCH(
      makePatchRequest('char-owned', {
        name: 'Stale write',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }),
      { params: Promise.resolve({ id: 'char-owned' }) },
    );

    expect(response.status).toBe(409);
    await expect(readJson(response)).resolves.toEqual({ error: 'Character was updated elsewhere' });
    expect(supabase.update).not.toHaveBeenCalled();
  });

  it('applies a matching updatedAt lock and stamps a new token', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);
    const response = await PATCH(
      makePatchRequest('char-owned', { notes: 'fresh', updatedAt: row.updated_at }),
      { params: Promise.resolve({ id: 'char-owned' }) },
    );

    expect(response.status).toBe(200);
    const body = await readJson<{ ok: boolean; updatedAt: string }>(response);
    expect(body.ok).toBe(true);
    expect(body.updatedAt).not.toBe(row.updated_at);
    expect(supabase.lastUpdate.payload?.updated_at).toBeTruthy();
  });

  it('deletes the stored portrait when the sheet stops referencing it', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid, {
      portrait: `https://cdn.test/storage/v1/object/public/portraits/${OWNER.uid}/char-owned.png`,
    });
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);
    const response = await PATCH(
      makePatchRequest('char-owned', {
        portrait: 'https://cdn.test/storage/v1/object/public/realms-images/library.png',
      }),
      { params: Promise.resolve({ id: 'char-owned' }) },
    );

    expect(response.status).toBe(200);
    expect(supabase.removePortrait).toHaveBeenCalledWith(
      expect.arrayContaining([`${OWNER.uid}/char-owned.png`]),
    );
  });

  it('keeps the stored portrait when the saved URL still points at it', async () => {
    const stored = `https://cdn.test/storage/v1/object/public/portraits/${OWNER.uid}/char-owned.png`;
    const row = makeCharacterRow('char-owned', OWNER.uid, { portrait: stored });
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    const supabase = createMockSupabase(row);
    mockCreateClient.mockResolvedValue(supabase as never);
    const response = await PATCH(makePatchRequest('char-owned', { portrait: stored }), {
      params: Promise.resolve({ id: 'char-owned' }),
    });

    expect(response.status).toBe(200);
    expect(supabase.removePortrait).not.toHaveBeenCalled();
  });

  describe('legality on merged save (B5)', () => {
    it('returns structured warnings when a level-5 patch pushes abilities over budget', async () => {
      const row = makeCharacterRow('char-l5', OWNER.uid, {
        level: 5,
        abilities: {
          strength: 2,
          vitality: 2,
          agility: 2,
          acuity: 2,
          intelligence: 0,
          charisma: 0,
        },
        archetype: { id: 'a1', type: 'power' },
      });
      mockGetSession.mockResolvedValue({ user: OWNER, error: null });
      mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

      const response = await PATCH(
        makePatchRequest('char-l5', {
          abilities: {
            strength: 50,
            vitality: 50,
            agility: 50,
            acuity: 50,
            intelligence: 0,
            charisma: 0,
          },
        }),
        { params: Promise.resolve({ id: 'char-l5' }) },
      );

      expect(response.status).toBe(200);
      const body = await readJson<{
        ok: boolean;
        legalityWarnings?: Array<{ code: string; level: number }> | undefined;
      }>(response);
      expect(body.ok).toBe(true);
      expect(
        body.legalityWarnings?.some(
          (w) => w.code === 'ability_points_over_budget' && w.level === 5,
        ),
      ).toBe(true);
    });

    it('returns warnings when the patch is benign but merged stored data is still over budget', async () => {
      const row = makeCharacterRow('char-stored-illegal', OWNER.uid, {
        level: 5,
        abilities: {
          strength: 50,
          vitality: 50,
          agility: 50,
          acuity: 50,
          intelligence: 0,
          charisma: 0,
        },
        archetype: { id: 'a1', type: 'power' },
      });
      mockGetSession.mockResolvedValue({ user: OWNER, error: null });
      mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

      const response = await PATCH(makePatchRequest('char-stored-illegal', { name: 'Renamed' }), {
        params: Promise.resolve({ id: 'char-stored-illegal' }),
      });

      expect(response.status).toBe(200);
      const body = await readJson<{
        ok: boolean;
        legalityWarnings?: Array<{ code: string }> | undefined;
      }>(response);
      expect(body.legalityWarnings?.some((w) => w.code === 'ability_points_over_budget')).toBe(
        true,
      );
    });

    it('returns 200 with pre-existing level-1 violations on a rename-only patch (master PATCH behavior)', async () => {
      const row = makeCharacterRow('char-l1-stored', OWNER.uid, {
        level: 1,
        abilities: {
          strength: 3,
          vitality: 3,
          agility: 3,
          acuity: 0,
          intelligence: 0,
          charisma: 0,
        },
        archetype: { id: 'a1', type: 'power' },
        archetypeFeats: [{ id: 'f1' }],
        feats: [{ id: 'c1' }],
        skills: [{ id: '1', skill_val: 1 }],
      });
      mockGetSession.mockResolvedValue({ user: OWNER, error: null });
      mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

      const response = await PATCH(makePatchRequest('char-l1-stored', { name: 'Renamed' }), {
        params: Promise.resolve({ id: 'char-l1-stored' }),
      });

      expect(response.status).toBe(200);
      const body = await readJson<{
        ok: boolean;
        legalityWarnings?: Array<{ code: string; detail?: string | undefined }> | undefined;
      }>(response);
      expect(body.legalityWarnings?.some((w) => w.code === 'level_1_preexisting_violation')).toBe(
        true,
      );
    });

    it('returns 400 when a level-1 patch introduces a new legality violation', async () => {
      const row = makeCharacterRow('char-l1-clean', OWNER.uid, {
        level: 1,
        abilities: {
          strength: 2,
          vitality: 2,
          agility: 1,
          acuity: 1,
          intelligence: 1,
          charisma: 0,
        },
        archetype: { id: 'a1', type: 'power' },
        archetypeFeats: [{ id: 'f1' }],
        feats: [{ id: 'c1' }],
        skills: [
          { id: '1', skill_val: 1 },
          { id: '2', skill_val: 1 },
          { id: '3', skill_val: 1 },
        ],
      });
      mockGetSession.mockResolvedValue({ user: OWNER, error: null });
      mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

      const response = await PATCH(
        makePatchRequest('char-l1-clean', {
          abilities: {
            strength: 3,
            vitality: 3,
            agility: 3,
            acuity: 0,
            intelligence: 0,
            charisma: 0,
          },
        }),
        { params: Promise.resolve({ id: 'char-l1-clean' }) },
      );

      expect(response.status).toBe(400);
      const body = await readJson<{ error: string; details?: string[] | undefined }>(response);
      expect(body.error).toBe('Character is not a legal level 1 build');
    });

    it('warns when a level downgrade changes budgets without changing spend', async () => {
      const row = makeCharacterRow('char-l5-down', OWNER.uid, {
        level: 5,
        abilities: {
          strength: 2,
          vitality: 2,
          agility: 2,
          acuity: 2,
          intelligence: 0,
          charisma: 0,
        },
        archetype: { id: 'a1', type: 'power' },
        skills: [
          { id: '1', skill_val: 1 },
          { id: '2', skill_val: 1 },
          { id: '3', skill_val: 1 },
        ],
      });
      mockGetSession.mockResolvedValue({ user: OWNER, error: null });
      mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

      const response = await PATCH(makePatchRequest('char-l5-down', { level: 2 }), {
        params: Promise.resolve({ id: 'char-l5-down' }),
      });

      expect(response.status).toBe(200);
      const body = await readJson<{
        legalityWarnings?: Array<{ code: string; level: number }> | undefined;
      }>(response);
      expect(
        body.legalityWarnings?.some(
          (w) => w.code === 'ability_points_over_budget' && w.level === 2,
        ),
      ).toBe(true);
    });

    it('skips codex catalog reads when the patch only changes non-feat fields', async () => {
      const row = makeCharacterRow('char-name-only', OWNER.uid, { level: 5 });
      mockGetSession.mockResolvedValue({ user: OWNER, error: null });
      let codexReads = 0;
      const supabase = createMockSupabase(row);
      const baseFrom = supabase.from;
      const wrapped = {
        ...supabase,
        from: vi.fn((table: string) => {
          if (table === 'codex_feats' || table === 'codex_skills') {
            codexReads++;
          }
          return baseFrom(table);
        }),
      };
      mockCreateClient.mockResolvedValue(wrapped as never);
      mockCreatePublicClient.mockReturnValue(wrapped as never);

      await PATCH(makePatchRequest('char-name-only', { name: 'Only Name' }), {
        params: Promise.resolve({ id: 'char-name-only' }),
      });

      expect(codexReads).toBe(0);
    });

    it('loads codex catalog when mart_abil changes', async () => {
      const row = makeCharacterRow('char-mart', OWNER.uid, { level: 5, mart_abil: 1 });
      mockGetSession.mockResolvedValue({ user: OWNER, error: null });
      let codexReads = 0;
      const supabase = createMockSupabase(row);
      const baseFrom = supabase.from;
      const wrapped = {
        ...supabase,
        from: vi.fn((table: string) => {
          if (table === 'codex_feats' || table === 'codex_skills') {
            codexReads++;
          }
          return baseFrom(table);
        }),
      };
      mockCreateClient.mockResolvedValue(wrapped as never);
      mockCreatePublicClient.mockReturnValue(wrapped as never);

      await PATCH(makePatchRequest('char-mart', { mart_abil: 2 }), {
        params: Promise.resolve({ id: 'char-mart' }),
      });

      expect(codexReads).toBeGreaterThan(0);
    });

    it('still saves when the feat catalog fails and returns feat_catalog_unavailable', async () => {
      const row = makeCharacterRow('char-catalog', OWNER.uid, {
        level: 5,
        abilities: {
          strength: 2,
          vitality: 2,
          agility: 2,
          acuity: 2,
          intelligence: 0,
          charisma: 0,
        },
      });
      mockGetSession.mockResolvedValue({ user: OWNER, error: null });
      const supabase = createMockSupabase(row);
      const baseFrom = supabase.from;
      const wrapped = {
        ...supabase,
        from: vi.fn((table: string) => {
          if (table === 'codex_feats' || table === 'codex_skills') {
            return {
              select: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'db error', code: 'XX000' },
              }),
            };
          }
          return baseFrom(table);
        }),
      };
      mockCreateClient.mockResolvedValue(wrapped as never);
      mockCreatePublicClient.mockReturnValue(wrapped as never);

      const response = await PATCH(
        makePatchRequest('char-catalog', {
          abilities: {
            strength: 50,
            vitality: 50,
            agility: 50,
            acuity: 50,
            intelligence: 0,
            charisma: 0,
          },
        }),
        { params: Promise.resolve({ id: 'char-catalog' }) },
      );

      expect(response.status).toBe(200);
      const body = await readJson<{ legalityUncomputable?: string[] | undefined }>(response);
      expect(body.legalityUncomputable).toContain('feat_catalog_unavailable');
    });
  });
});

describe('DELETE /api/characters/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await DELETE(makeDeleteRequest('char-1'), {
      params: Promise.resolve({ id: 'char-1' }),
    });

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when another user tries to delete a character (IDOR)', async () => {
    const row = makeCharacterRow('char-private', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await DELETE(makeDeleteRequest('char-private'), {
      params: Promise.resolve({ id: 'char-private' }),
    });

    expect(response.status).toBe(404);
    await expect(readJson(response)).resolves.toEqual({ error: 'Character not found' });
  });

  it('deletes the character for the owner', async () => {
    const row = makeCharacterRow('char-owned', OWNER.uid);
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockCreateClient.mockResolvedValue(createMockSupabase(row) as never);

    const response = await DELETE(makeDeleteRequest('char-owned'), {
      params: Promise.resolve({ id: 'char-owned' }),
    });

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ ok: true });
  });
});
