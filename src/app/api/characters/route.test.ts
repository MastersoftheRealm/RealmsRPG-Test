import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/role-policy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/role-policy')>();
  return {
    ...actual,
    getRolePolicyForUser: vi.fn(),
  };
});

vi.mock('@/lib/ensure-user-profile', () => ({
  ensureUserProfile: vi.fn(),
}));

vi.mock('@/lib/game/archetype-display', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/game/archetype-display')>();
  return {
    ...actual,
    fetchArchetypeNameMap: vi.fn(),
  };
});

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

import { GET, POST } from './route';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { getSession } from '@/lib/supabase/session';
import { createClient } from '@/lib/supabase/server';
import { getRolePolicyForUser } from '@/lib/role-policy';
import { ensureUserProfile } from '@/lib/ensure-user-profile';
import { fetchArchetypeNameMap } from '@/lib/game/archetype-display';
import { standardLimiter } from '@/lib/rate-limit';
import { getDefaultRolePolicy } from '@/lib/role-policy';
import { defined } from '@/lib/utils';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockGetRolePolicyForUser = vi.mocked(getRolePolicyForUser);
const mockEnsureUserProfile = vi.mocked(ensureUserProfile);
const mockFetchArchetypeNameMap = vi.mocked(fetchArchetypeNameMap);
const mockStandardLimiterCheck = vi.mocked(standardLimiter.check);

const TEST_USER = { uid: 'user-123', email: 'hero@example.com' };
const CREATE_FAILED = GUIDED_CREATOR_COPY.steps.reveal.saveFailed;

type MockSupabaseConfig = {
  characters?: unknown[] | undefined;
  charactersError?: { message: string } | null | undefined;
  characterCount?: number | undefined;
  insertId?: string | undefined;
  /** Row the idempotency lookup finds for the request's `clientRequestId`. */
  replayCharacterId?: string | null | undefined;
  /**
   * Row the lookup finds only once an insert has been attempted — the concurrent-retry
   * race, where both requests miss the lookup and the unique index picks a winner.
   */
  replayCharacterIdAfterInsert?: string | null | undefined;
  /** Error the insert rejects with (e.g. a 23505 from the idempotency index). */
  insertError?: { code?: string | undefined; message?: string | undefined } | null;
  coreRules?: Array<{ id: string; data: unknown }> | undefined;
  /** Official feats for the level-1 requirement check. Default [] skips the check. */
  codexFeats?: unknown[] | undefined;
  codexSkills?: unknown[] | undefined;
  /** When set, the catalog skill select fails (e.g. a 42703 from a wrong column). */
  codexSkillsError?: {
    message?: string | undefined;
    hint?: string | undefined;
    code?: string | undefined;
  } | null;
};

function createMockSupabase(config: MockSupabaseConfig = {}) {
  const {
    characters = [],
    charactersError = null,
    characterCount = 0,
    insertId = 'char-new-uuid',
    replayCharacterId = null,
    replayCharacterIdAfterInsert = null,
    insertError = null,
    coreRules = [],
    codexFeats = [],
    codexSkills = [],
    codexSkillsError = null,
  } = config;

  let insertAttempted = false;
  let skillSelectColumns: string | undefined;
  const insertedRows: Array<Record<string, unknown>> = [];
  const insert = vi.fn((row: Record<string, unknown>) => {
    insertAttempted = true;
    insertedRows.push(row);
    return {
      select: vi.fn().mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue(
            insertError
              ? { data: null, error: insertError }
              : { data: { id: insertId }, error: null },
          ),
      }),
    };
  });

  const replayedId = () =>
    (insertAttempted ? (replayCharacterIdAfterInsert ?? replayCharacterId) : replayCharacterId) ??
    null;

  const client = {
    from: vi.fn((table: string) => {
      if (table === 'characters') {
        return {
          select: vi.fn(
            (cols?: string, opts?: { count?: string | undefined; head?: boolean | undefined }) => {
              if (opts?.head) {
                return {
                  eq: vi.fn().mockResolvedValue({ count: characterCount, error: null }),
                };
              }
              // `.eq()` returns itself so the idempotency lookup can chain user_id +
              // client_request_id before `.maybeSingle()`.
              const query: Record<string, unknown> = {
                order: vi.fn().mockResolvedValue({ data: characters, error: charactersError }),
                maybeSingle: vi.fn(async () => {
                  const id = cols === 'id' ? replayedId() : null;
                  return { data: id ? { id } : null, error: null };
                }),
              };
              query.eq = vi.fn().mockReturnValue(query);
              return query;
            },
          ),
          insert,
        };
      }
      if (table === 'core_rules') {
        return { select: vi.fn().mockResolvedValue({ data: coreRules, error: null }) };
      }
      if (table === 'codex_feats') {
        return { select: vi.fn().mockResolvedValue({ data: codexFeats, error: null }) };
      }
      if (table === 'codex_skills') {
        return {
          select: vi.fn((cols?: string) => {
            skillSelectColumns = cols;
            return Promise.resolve(
              codexSkillsError
                ? { data: null, error: codexSkillsError }
                : { data: codexSkills, error: null },
            );
          }),
        };
      }
      if (table === 'user_profiles') {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
    insertMock: insert,
    insertedRows,
    get skillSelectColumns() {
      return skillSelectColumns;
    },
  };

  return client;
}

/** A legal level-1 build, so legality checks pass and the create path is exercised. */
function legalLevel1Payload(extra: Record<string, unknown> = {}) {
  return {
    name: 'New Hero',
    level: 1,
    abilities: { strength: 2, vitality: 2, agility: 1, acuity: 1, intelligence: 1, charisma: 0 },
    skills: [{ id: '1', skill_val: 1, prof: true }],
    archetype: { id: 'a1', type: 'power' },
    archetypeFeats: [{ id: 'f1' }],
    feats: [{ id: 'c1' }],
    currency: 40,
    healthPoints: 10,
    energyPoints: 8,
    ...extra,
  };
}

function makePostRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/characters', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.1',
      origin: 'http://localhost',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe('GET /api/characters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchArchetypeNameMap.mockResolvedValue(new Map());
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns character summaries for an authenticated user', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
    mockCreateClient.mockResolvedValue(
      createMockSupabase({
        characters: [
          {
            id: 'char-1',
            data: { name: 'Aria', level: 3, portrait: 'https://example.com/p.png' },
            updated_at: '2026-07-01T12:00:00.000Z',
            name: 'Aria',
            level: 3,
            archetype_name: 'Martial Artist',
            ancestry_name: 'Human',
            status: 'active',
            visibility: 'private',
          },
        ],
      }) as never,
    );

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual([
      {
        id: 'char-1',
        name: 'Aria',
        level: 3,
        portrait: 'https://example.com/p.png',
        archetypeName: 'Martial Artist',
        ancestryName: 'Human',
        status: 'active',
        visibility: 'private',
        updatedAt: '2026-07-01T12:00:00.000Z',
      },
    ]);
  });

  it('returns 500 when the database query fails', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ charactersError: { message: 'db down' } }) as never,
    );

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(readJson(response)).resolves.toEqual({ error: 'Failed to load characters' });
  });
});

describe('POST /api/characters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchArchetypeNameMap.mockResolvedValue(new Map());
    mockEnsureUserProfile.mockResolvedValue(undefined);
    mockGetRolePolicyForUser.mockResolvedValue(getDefaultRolePolicy('new_player'));
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await POST(makePostRequest({ name: 'New Hero' }));

    expect(response.status).toBe(401);
    await expect(readJson(response)).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns 415 when Content-Type is not JSON', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });

    const request = new NextRequest('http://localhost/api/characters', {
      method: 'POST',
      headers: { 'content-type': 'text/html', origin: 'http://localhost' },
      body: '<p>not json</p>',
    });

    const response = await POST(request);

    expect(response.status).toBe(415);
    await expect(readJson(response)).resolves.toEqual({
      error: 'Content-Type must be application/json',
    });
  });

  it('returns 415 for text/plain (no CORS preflight content type)', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });

    const request = new NextRequest('http://localhost/api/characters', {
      method: 'POST',
      headers: { 'content-type': 'text/plain', origin: 'http://localhost' },
      body: JSON.stringify({ name: 'Sneaky Hero' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(415);
  });

  it('returns 403 for a cross-origin create', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });

    const response = await POST(
      makePostRequest({ name: 'New Hero' }, { origin: 'https://evil.example' }),
    );

    expect(response.status).toBe(403);
  });

  it('returns 400 when the body fails Zod validation', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });

    const response = await POST(makePostRequest({ name: '' }));

    expect(response.status).toBe(400);
    const body = await readJson<{ error: string; details?: string[] | undefined }>(response);
    expect(body.error).toBe('Validation failed');
    expect(body.details?.some((d) => d.includes('name'))).toBe(true);
  });

  it('creates a character and returns the new id', async () => {
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ characterCount: 1, insertId: 'created-char-id' }) as never,
    );

    const response = await POST(makePostRequest({ name: 'New Hero', level: 2 }));

    expect(response.status).toBe(200);
    await expect(readJson(response)).resolves.toEqual({ id: 'created-char-id' });
    expect(mockEnsureUserProfile).toHaveBeenCalled();
  });

  it('returns 403 when the user is at the character quota', async () => {
    const policy = getDefaultRolePolicy('new_player');
    mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
    mockGetRolePolicyForUser.mockResolvedValue(policy);
    mockCreateClient.mockResolvedValue(
      createMockSupabase({ characterCount: policy.maxCharacters }) as never,
    );

    const response = await POST(makePostRequest({ name: 'One Too Many' }));

    expect(response.status).toBe(403);
    const body = await readJson<{ error: string; code?: string | undefined }>(response);
    expect(body.error).toMatch(/character/i);
  });

  describe('level-1 legality (report 03 P1-7)', () => {
    it('rejects an over-budget level-1 build with the failing rules', async () => {
      mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
      mockCreateClient.mockResolvedValue(createMockSupabase() as never);

      const response = await POST(
        makePostRequest(
          legalLevel1Payload({
            abilities: {
              strength: 3,
              vitality: 3,
              agility: 3,
              acuity: 0,
              intelligence: 0,
              charisma: 0,
            },
            currency: -25,
          }),
        ),
      );

      expect(response.status).toBe(400);
      const body = await readJson<{ error: string; details?: string[] | undefined }>(response);
      expect(body.error).toBe('Character is not a legal level 1 build');
      expect(body.details?.some((d) => /Ability points/.test(d))).toBe(true);
      // Negative currency is floored by prepareCharacterForCreate (TASK-739), so it is
      // not a legality detail on this path. The helper still rejects unclamped debt.
    });

    it('creates a legal level-1 build with overspent currency floored to 0', async () => {
      mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
      const supabase = createMockSupabase({ insertId: 'clamped-currency-id' });
      mockCreateClient.mockResolvedValue(supabase as never);

      const response = await POST(makePostRequest(legalLevel1Payload({ currency: -25 })));

      expect(response.status).toBe(200);
      await expect(readJson(response)).resolves.toEqual({ id: 'clamped-currency-id' });
      const inserted = supabase.insertedRows[0]?.data as
        | { currency?: number | undefined }
        | undefined;
      expect(inserted?.currency).toBe(0);
    });

    it('creates a legal level-1 build', async () => {
      mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
      mockCreateClient.mockResolvedValue(
        createMockSupabase({ insertId: 'legal-char-id' }) as never,
      );

      const response = await POST(makePostRequest(legalLevel1Payload()));

      expect(response.status).toBe(200);
      await expect(readJson(response)).resolves.toEqual({ id: 'legal-char-id' });
    });

    it('does not gate levels above 1, whose level-up spend the document cannot show', async () => {
      mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
      mockCreateClient.mockResolvedValue(createMockSupabase({ insertId: 'lvl5-id' }) as never);

      const response = await POST(
        makePostRequest(
          legalLevel1Payload({
            level: 5,
            abilities: {
              strength: 3,
              vitality: 3,
              agility: 3,
              acuity: 3,
              intelligence: 0,
              charisma: 0,
            },
          }),
        ),
      );

      expect(response.status).toBe(200);
    });

    it('refuses a catalog feat whose requirements the build does not meet', async () => {
      mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
      mockCreateClient.mockResolvedValue(
        createMockSupabase({
          insertId: 'should-not-insert',
          codexFeats: [{ id: 'c1', name: 'Needs Level 4', lvl_req: 4 }],
        }) as never,
      );

      const response = await POST(makePostRequest(legalLevel1Payload()));

      expect(response.status).toBe(400);
      const body = await readJson<{ error: string; details?: string[] | undefined }>(response);
      expect(body.error).toBe('Character is not a legal level 1 build');
      expect(body.details?.some((d) => /Needs Level 4/.test(d))).toBe(true);
    });
  });

  describe('idempotency key (report 03 P1-8)', () => {
    const clientRequestId = '11111111-2222-4333-8444-555555555555';

    it('rejects a malformed key rather than silently ignoring it', async () => {
      mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });

      const response = await POST(
        makePostRequest({ name: 'New Hero', clientRequestId: 'not-a-uuid' }),
      );

      expect(response.status).toBe(400);
    });

    it('replays the first character instead of inserting a second one', async () => {
      mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
      const supabase = createMockSupabase({ replayCharacterId: 'already-created-id' });
      mockCreateClient.mockResolvedValue(supabase as never);

      const response = await POST(makePostRequest(legalLevel1Payload({ clientRequestId })));

      expect(response.status).toBe(200);
      await expect(readJson(response)).resolves.toEqual({ id: 'already-created-id' });
      expect(supabase.insertMock).not.toHaveBeenCalled();
    });

    it('replays ahead of the quota check, so a retry is not refused for the slot it took', async () => {
      const policy = getDefaultRolePolicy('new_player');
      mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
      mockGetRolePolicyForUser.mockResolvedValue(policy);
      mockCreateClient.mockResolvedValue(
        createMockSupabase({
          characterCount: policy.maxCharacters,
          replayCharacterId: 'already-created-id',
        }) as never,
      );

      const response = await POST(makePostRequest(legalLevel1Payload({ clientRequestId })));

      expect(response.status).toBe(200);
      await expect(readJson(response)).resolves.toEqual({ id: 'already-created-id' });
    });

    it('persists the key so a later retry can find the row', async () => {
      mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
      const supabase = createMockSupabase({ insertId: 'fresh-id' });
      mockCreateClient.mockResolvedValue(supabase as never);

      const response = await POST(makePostRequest(legalLevel1Payload({ clientRequestId })));

      expect(response.status).toBe(200);
      expect(supabase.insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ client_request_id: clientRequestId }),
      );
      // The key is routing metadata, not character data.
      const savedData = defined(supabase.insertedRows[0]).data as Record<string, unknown>;
      expect(savedData.clientRequestId).toBeUndefined();
    });

    it('returns the winning row when a concurrent retry loses the unique index', async () => {
      mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
      // Both requests miss the lookup, then this one's insert hits 23505.
      mockCreateClient.mockResolvedValue(
        createMockSupabase({
          insertError: { code: '23505' },
          replayCharacterIdAfterInsert: 'race-winner-id',
        }) as never,
      );

      const response = await POST(makePostRequest(legalLevel1Payload({ clientRequestId })));

      expect(response.status).toBe(200);
      await expect(readJson(response)).resolves.toEqual({ id: 'race-winner-id' });
    });

    it('still surfaces a non-idempotency insert failure as a 500 without Postgres fields', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
      mockCreateClient.mockResolvedValue(
        createMockSupabase({ insertError: { code: '23503', message: 'fk violation' } }) as never,
      );

      const response = await POST(makePostRequest(legalLevel1Payload({ clientRequestId })));

      expect(response.status).toBe(500);
      const body = await readJson<Record<string, unknown>>(response);
      expect(body).toEqual({ error: CREATE_FAILED });
      expect(JSON.stringify(body)).not.toMatch(/fk violation|23503/);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('feat-requirement catalog columns (TASK-754)', () => {
    it('selects live codex_skills.base_skill, not the app-layer base_skill_id', async () => {
      mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
      const supabase = createMockSupabase();
      mockCreateClient.mockResolvedValue(supabase as never);

      const response = await POST(makePostRequest(legalLevel1Payload()));

      expect(response.status).toBe(200);
      expect(supabase.skillSelectColumns).toBe('id, name, base_skill, ability');
      expect(supabase.skillSelectColumns).not.toContain('base_skill_id');
    });

    it('returns a generic 500 when the skill catalog query fails, without Postgres fields', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetSession.mockResolvedValue({ user: TEST_USER, error: null });
      mockCreateClient.mockResolvedValue(
        createMockSupabase({
          codexSkillsError: {
            code: '42703',
            message: 'column codex_skills.base_skill_id does not exist',
            hint: 'Perhaps you meant to reference the column "codex_skills.base_skill".',
          },
        }) as never,
      );

      const response = await POST(makePostRequest(legalLevel1Payload()));

      expect(response.status).toBe(500);
      const body = await readJson<Record<string, unknown>>(response);
      expect(body).toEqual({ error: CREATE_FAILED });
      expect(JSON.stringify(body)).not.toMatch(
        /42703|base_skill_id|does not exist|Perhaps you meant/,
      );
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
