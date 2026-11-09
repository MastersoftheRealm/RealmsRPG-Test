/**
 * B7 route matrix — auth, validation, and fail-closed checks on audited mutation handlers.
 * Per-route mocks live in each `route.test.ts`; this file covers cross-cutting gaps.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
  requireLiveUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
  requireLiveAdminSession: vi.fn(),
}));

vi.mock('@/lib/rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/rate-limit')>();
  return {
    ...actual,
    standardLimiter: { check: vi.fn() },
  };
});

vi.mock('@/lib/supabase/public-client', () => ({
  createPublicClient: vi.fn(() => null),
}));

vi.mock('@/lib/entity-image-enrich-server', () => ({
  enrichRowsWithBankImageUrls: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/codex/id-allocation', () => ({
  allocateCodexNumericId: vi.fn(),
  retireCodexId: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/codex-changelog', () => ({
  recordCodexChange: vi.fn(async () => undefined),
}));

import { PATCH as patchCrafting, DELETE as deleteCrafting } from '@/app/api/crafting/[id]/route';
import { PATCH as patchEnhancedItem } from '@/app/api/user/enhanced-items/[id]/route';
import {
  GET as getOfficial,
  POST as postOfficial,
  PATCH as patchOfficial,
  DELETE as deleteOfficial,
} from '@/app/api/official/[type]/route';
import {
  POST as postUserLibrary,
  GET as getUserLibrary,
} from '@/app/api/user/library/[type]/route';
import {
  PATCH as patchUserLibraryItem,
  DELETE as deleteUserLibraryItem,
} from '@/app/api/user/library/[type]/[id]/route';
import { getSession } from '@/lib/supabase/session';
import { requireLiveAdminSession } from '@/lib/admin';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public-client';
import { standardLimiter } from '@/lib/rate-limit';
import { allocateCodexNumericId } from '@/lib/codex/id-allocation';

const mockGetSession = vi.mocked(getSession);
const mockRequireLiveAdminSession = vi.mocked(requireLiveAdminSession);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);
const mockCreatePublicClient = vi.mocked(createPublicClient);
const mockStandardLimiterCheck = vi.mocked(standardLimiter.check);
const mockAllocateCodexNumericId = vi.mocked(allocateCodexNumericId);

const OWNER = { uid: 'owner-user', email: 'owner@example.com' };

const LIBRARY_TYPES = [
  'powers',
  'techniques',
  'empowered-techniques',
  'items',
  'creatures',
  'species',
] as const;

type LibraryType = (typeof LIBRARY_TYPES)[number];

const VALID_OFFICIAL_BODY: Record<LibraryType, Record<string, unknown>> = {
  powers: { name: 'Bolt', parts: [] },
  techniques: { name: 'Riposte', parts: [] },
  'empowered-techniques': {
    name: 'Arc',
    totals: { energy: 3 },
    power: { parts: [] },
    technique: { parts: [] },
  },
  items: { name: 'Tower', type: 'shield', hasShieldDamage: true, properties: [] },
  creatures: {
    name: 'Wolf',
    level: 1,
    archetypeType: 'power',
    abilities: { strength: 0, vitality: 0, agility: 0, acuity: 0, intelligence: 0, charisma: 0 },
    defenses: {
      might: 0,
      fortitude: 0,
      reflex: 0,
      discernment: 0,
      mentalFortitude: 0,
      resolve: 0,
    },
  },
  species: { name: 'Riverfolk' },
};

/** Creator-shaped species payload (string ID arrays, numeric anthropometrics). */
const POPULATED_SPECIES_BODY = {
  name: 'Riverfolk',
  description: 'Aquatic ancestry',
  type: 'humanoid',
  sizes: ['Medium', 'Small'],
  skills: ['athletics', 'stealth'],
  species_traits: ['amphibious'],
  ancestry_traits: ['keen_senses'],
  flaws: [],
  characteristics: ['resilient'],
  languages: ['Common', 'Aquan'],
  ave_hgt_cm: 170,
  ave_wgt_kg: 70,
  adulthood_lifespan: [18, 80],
};

const BAD_SHAPE_BODY: Record<LibraryType, Record<string, unknown>> = {
  powers: { name: 'Bolt', parts: { bad: true } },
  techniques: { name: 'Riposte', parts: 'not-an-array' },
  'empowered-techniques': { name: 'Arc', power: 'not-an-object' },
  items: { name: 'Tower', type: 'shield', properties: 'not-an-array' },
  creatures: {
    name: 'Wolf',
    skills: [{ name: 'Athletics', value: 2, proficient: 'yes' }],
  },
  species: {
    name: 'Riverfolk',
    languages: 'not-an-array',
  },
};

const OVERSIZE_HEADERS = {
  'content-type': 'application/json',
  'content-length': String(5 * 1024 * 1024),
  origin: 'http://localhost',
} as const;

type MockCountSelectResult = { data: null; error: null; count: number };
type MockListSelectResult = { data: unknown[]; error: null };

type UserLibraryMockClient = {
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
  inserts: string[];
};

const USER_LIBRARY_TABLES = new Set([
  'user_powers',
  'user_techniques',
  'user_empowered_techniques',
  'user_items',
  'user_creatures',
  'user_species',
]);

const USER_LIBRARY_KIND_TO_TABLE: Record<string, string> = {
  powers: 'user_powers',
  techniques: 'user_techniques',
  'empowered-techniques': 'user_empowered_techniques',
  items: 'user_items',
  creatures: 'user_creatures',
  species: 'user_species',
};

function makeLibraryQuotaInsertRpc(handlers: {
  onInsert: (table: string, row: Record<string, unknown>) => void;
}) {
  return vi.fn(async (name: string, args: Record<string, unknown>) => {
    if (name !== 'insert_user_library_row_with_quota') {
      return { data: null, error: { message: `Unexpected RPC: ${name}` } };
    }
    const kind = String(args.p_library_kind);
    const table = USER_LIBRARY_KIND_TO_TABLE[kind];
    if (!table) {
      return { data: null, error: { message: `Unexpected library kind: ${kind}` } };
    }
    const row = args.p_row as Record<string, unknown>;
    handlers.onInsert(table, row);
    const id = typeof row.id === 'string' ? row.id : String(row.id ?? 'generated-id');
    return { data: { id }, error: null };
  });
}

function makeEqThenChain<T extends MockCountSelectResult | MockListSelectResult>(result: T) {
  const filters = {
    eq: vi.fn(() => filters),
    then: (resolve: (value: T) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return filters;
}

function userLibraryCreateClient(): UserLibraryMockClient {
  const inserts: string[] = [];
  const from = vi.fn((table: string) => {
    if (table === 'user_profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: { id: OWNER.uid, role: 'new_player' },
              error: null,
            })),
          })),
        })),
        insert: vi.fn(async () => ({ data: null, error: null })),
      };
    }
    if (table === 'role_policies') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      };
    }
    return {
      select: vi.fn((_columns: string, query?: { head?: boolean }) => {
        if (query?.head) {
          const headResult: MockCountSelectResult = { data: null, error: null, count: 0 };
          return makeEqThenChain(headResult);
        }
        const listResult: MockListSelectResult = { data: [], error: null };
        return makeEqThenChain(listResult);
      }),
      insert: vi.fn(async () => {
        inserts.push(table);
        return { data: null, error: null };
      }),
    };
  });
  const rpc = makeLibraryQuotaInsertRpc({
    onInsert: (table) => {
      inserts.push(table);
    },
  });
  return { from, rpc, inserts };
}

function createUserLibraryRoundTripClient(): {
  client: UserLibraryMockClient;
  getListedRow: () => Record<string, unknown> | null;
} {
  let listedRow: Record<string, unknown> | null = null;
  const inserts: string[] = [];

  const from = vi.fn((table: string) => {
    if (table === 'user_profiles') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: { id: OWNER.uid, role: 'new_player' },
              error: null,
            })),
          })),
        })),
        insert: vi.fn(async () => ({ data: null, error: null })),
      };
    }
    if (table === 'role_policies') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      };
    }
    if (!USER_LIBRARY_TABLES.has(table)) {
      throw new Error(`Unexpected table: ${table}`);
    }
    return {
      select: vi.fn((_columns: string, query?: { head?: boolean }) => {
        if (query?.head) {
          const headResult: MockCountSelectResult = { data: null, error: null, count: 0 };
          return makeEqThenChain(headResult);
        }
        const listData: unknown[] = listedRow ? [listedRow] : [];
        const listResult: MockListSelectResult = { data: listData, error: null };
        return makeEqThenChain(listResult);
      }),
      insert: vi.fn((row: Record<string, unknown>) => {
        listedRow = { ...row };
        inserts.push(table);
        return Promise.resolve({ data: null, error: null });
      }),
    };
  });

  const rpc = makeLibraryQuotaInsertRpc({
    onInsert: (table, row) => {
      listedRow = { ...row };
      inserts.push(table);
    },
  });

  return {
    client: { from, rpc, inserts },
    getListedRow: () => listedRow,
  };
}

describe('B7 matrix — crafting PATCH', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 429 when rate limited (fail-closed, no write)', async () => {
    mockStandardLimiterCheck.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const response = await patchCrafting(
      new NextRequest('http://localhost/api/crafting/craft-owned', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', origin: 'http://localhost' },
        body: JSON.stringify({ status: 'in_progress' }),
      }),
      { params: Promise.resolve({ id: 'craft-owned' }) },
    );

    expect(response.status).toBe(429);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('returns 403 when Origin is missing without writing', async () => {
    const response = await patchCrafting(
      new NextRequest('http://localhost/api/crafting/craft-owned', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      }),
      { params: Promise.resolve({ id: 'craft-owned' }) },
    );

    expect(response.status).toBe(403);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});

describe('B7 matrix — crafting DELETE', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 403 when Origin is missing without writing', async () => {
    const response = await deleteCrafting(
      new NextRequest('http://localhost/api/crafting/craft-owned', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'craft-owned' }) },
    );

    expect(response.status).toBe(403);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});

describe('B7 matrix — enhanced-items PATCH', () => {
  const update = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    update.mockReset();
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
    const selectChain = {
      eq: vi.fn(function eq() {
        return selectChain;
      }),
      maybeSingle: vi.fn(async () => ({
        data: { id: 'enh-owned', user_id: OWNER.uid, data: {} },
        error: null,
      })),
    };
    mockCreateClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => selectChain),
        update,
      })),
    } as never);
  });

  it('returns 403 for a cross-origin patch without writing', async () => {
    const response = await patchEnhancedItem(
      new NextRequest('http://localhost/api/user/enhanced-items/enh-owned', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
        body: JSON.stringify({ potency: 2 }),
      }),
      { params: Promise.resolve({ id: 'enh-owned' }) },
    );
    expect(response.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
    expect(mockCreateClient).not.toHaveBeenCalled();
  });
});

describe('B7 matrix — official mutations', () => {
  const officialInsert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    officialInsert.mockReset();
    officialInsert.mockImplementation(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({ data: { id: 'new' }, error: null })),
      })),
    }));
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: OWNER.uid });
    mockCreateServiceRoleClient.mockReturnValue({
      from: vi.fn(() => ({
        insert: officialInsert,
        select: vi.fn(() => ({
          ilike: vi.fn().mockReturnThis(),
          neq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
        })),
      })),
    } as never);
  });

  it('POST returns 403 when Origin is missing without writing', async () => {
    const response = await postOfficial(
      new NextRequest('http://localhost/api/official/powers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Bolt' }),
      }),
      { params: Promise.resolve({ type: 'powers' }) },
    );

    expect(response.status).toBe(403);
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('PATCH returns 403 when Origin is missing without writing', async () => {
    const response = await patchOfficial(
      new NextRequest('http://localhost/api/official/powers', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: '11111111-1111-1111-1111-111111111111',
          catalogListing: 'listed',
        }),
      }),
      { params: Promise.resolve({ type: 'powers' }) },
    );

    expect(response.status).toBe(403);
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('DELETE returns 403 when Origin is missing without writing', async () => {
    const response = await deleteOfficial(
      new NextRequest('http://localhost/api/official/powers?id=item-1', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ type: 'powers' }) },
    );

    expect(response.status).toBe(403);
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it('POST returns 413 for an oversized JSON body without writing', async () => {
    const response = await postOfficial(
      new NextRequest('http://localhost/api/official/powers', {
        method: 'POST',
        headers: OVERSIZE_HEADERS,
        body: JSON.stringify({ name: 'Bolt' }),
      }),
      { params: Promise.resolve({ type: 'powers' }) },
    );

    expect(response.status).toBe(413);
    expect(officialInsert).not.toHaveBeenCalled();
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });

  it.each(LIBRARY_TYPES)(
    'POST official (%s) rejects unknown persisted fields without writing',
    async (type) => {
      const response = await postOfficial(
        new NextRequest(`http://localhost/api/official/${type}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: 'http://localhost' },
          body: JSON.stringify({ ...VALID_OFFICIAL_BODY[type], b7UnknownField: true }),
        }),
        { params: Promise.resolve({ type }) },
      );

      expect(response.status).toBe(400);
      expect(officialInsert).not.toHaveBeenCalled();
    },
  );

  it.each(LIBRARY_TYPES)(
    'POST official (%s) rejects bad-shaped payloads without writing',
    async (type) => {
      const response = await postOfficial(
        new NextRequest(`http://localhost/api/official/${type}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: 'http://localhost' },
          body: JSON.stringify(BAD_SHAPE_BODY[type]),
        }),
        { params: Promise.resolve({ type }) },
      );

      expect(response.status).toBe(400);
      expect(officialInsert).not.toHaveBeenCalled();
    },
  );

  it('official power POST then GET returns the normalized persisted shape', async () => {
    let insertedRow: Record<string, unknown> | null = null;
    officialInsert.mockImplementation((row: Record<string, unknown>) => {
      insertedRow = { ...row };
      return {
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: insertedRow, error: null })),
        })),
      };
    });

    const postResponse = await postOfficial(
      new NextRequest('http://localhost/api/official/powers', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost' },
        body: JSON.stringify({ name: 'Normalized Bolt', parts: [] }),
      }),
      { params: Promise.resolve({ type: 'powers' }) },
    );
    expect(postResponse.status).toBe(200);
    const postBody = (await postResponse.json()) as { id: string };
    expect(insertedRow).not.toBeNull();
    expect(postBody.id).toBe(insertedRow!.id);

    const listQuery = {
      eq: vi.fn(function eq() {
        return listQuery;
      }),
      then(
        onFulfilled?: (value: { data: unknown[]; error: null }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        return Promise.resolve({ data: insertedRow ? [insertedRow] : [], error: null }).then(
          onFulfilled,
          onRejected,
        );
      },
    };
    mockCreatePublicClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => listQuery),
      })),
    } as never);

    const getResponse = await getOfficial(new NextRequest('http://localhost/api/official/powers'), {
      params: Promise.resolve({ type: 'powers' }),
    });
    expect(getResponse.status).toBe(200);
    const items = (await getResponse.json()) as Record<string, unknown>[];
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(postBody.id);
    expect(items[0]?.id).toBe(insertedRow!.id);
    expect(items[0]).toMatchObject({
      name: 'Normalized Bolt',
      parts: [],
    });
    expect(items[0]).not.toHaveProperty('b7UnknownField');
  });

  it('POST official species accepts a populated creator-shaped payload and persists list fields', async () => {
    mockAllocateCodexNumericId.mockResolvedValueOnce('901');
    let insertedRow: Record<string, unknown> | null = null;
    const speciesInsert = vi.fn((row: Record<string, unknown>) => {
      insertedRow = row;
      const persisted = { ...row, id: '901' };
      return {
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: persisted, error: null })),
        })),
      };
    });
    mockCreateServiceRoleClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== 'codex_species') throw new Error(`Unexpected table: ${table}`);
        return {
          insert: speciesInsert,
        };
      }),
    } as never);

    const response = await postOfficial(
      new NextRequest('http://localhost/api/official/species', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost' },
        body: JSON.stringify(POPULATED_SPECIES_BODY),
      }),
      { params: Promise.resolve({ type: 'species' }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: '901' });
    expect(speciesInsert).toHaveBeenCalled();
    expect(insertedRow).toMatchObject({
      name: 'Riverfolk',
      languages: 'Common,Aquan',
      sizes: 'Medium,Small',
    });
  });
});

describe('B7 matrix — official POST (legacy case)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireLiveAdminSession.mockResolvedValue({ ok: true, userId: OWNER.uid });
    mockCreateServiceRoleClient.mockReturnValue({
      from: vi.fn(() => ({
        insert: vi.fn(),
      })),
    } as never);
  });

  it('returns 400 for unsupported official power fields without writing', async () => {
    const response = await postOfficial(
      new NextRequest('http://localhost/api/official/powers', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost' },
        body: JSON.stringify({ name: 'Bolt', injectedOfficialKey: true }),
      }),
      { params: Promise.resolve({ type: 'powers' }) },
    );
    expect(response.status).toBe(400);
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
  });
});

describe('B7 matrix — user library POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
  });

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });

    const response = await postUserLibrary(
      new NextRequest('http://localhost/api/user/library/powers', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost' },
        body: JSON.stringify({ name: 'Bolt' }),
      }),
      { params: Promise.resolve({ type: 'powers' }) },
    );

    expect(response.status).toBe(401);
  });

  it('returns 403 when Origin is missing without writing', async () => {
    const client = userLibraryCreateClient();
    mockCreateClient.mockResolvedValue(client as never);

    const response = await postUserLibrary(
      new NextRequest('http://localhost/api/user/library/powers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Bolt', parts: [] }),
      }),
      { params: Promise.resolve({ type: 'powers' }) },
    );

    expect(response.status).toBe(403);
    expect(client.inserts).toEqual([]);
  });

  it('returns 413 for an oversized JSON body without writing', async () => {
    const client = userLibraryCreateClient();
    mockCreateClient.mockResolvedValue(client as never);

    const response = await postUserLibrary(
      new NextRequest('http://localhost/api/user/library/powers', {
        method: 'POST',
        headers: OVERSIZE_HEADERS,
        body: JSON.stringify({ name: 'Bolt', parts: [] }),
      }),
      { params: Promise.resolve({ type: 'powers' }) },
    );

    expect(response.status).toBe(413);
    expect(client.inserts).toEqual([]);
  });

  it.each(LIBRARY_TYPES)(
    'POST user library (%s) rejects unknown persisted fields without writing',
    async (type) => {
      const client = userLibraryCreateClient();
      mockCreateClient.mockResolvedValue(client as never);

      const response = await postUserLibrary(
        new NextRequest(`http://localhost/api/user/library/${type}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: 'http://localhost' },
          body: JSON.stringify({ ...VALID_OFFICIAL_BODY[type], b7UnknownField: true }),
        }),
        { params: Promise.resolve({ type }) },
      );

      expect(response.status).toBe(400);
      expect(client.inserts).toEqual([]);
    },
  );

  it.each(LIBRARY_TYPES)(
    'POST user library (%s) rejects bad-shaped payloads without writing',
    async (type) => {
      const client = userLibraryCreateClient();
      mockCreateClient.mockResolvedValue(client as never);

      const response = await postUserLibrary(
        new NextRequest(`http://localhost/api/user/library/${type}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: 'http://localhost' },
          body: JSON.stringify(BAD_SHAPE_BODY[type]),
        }),
        { params: Promise.resolve({ type }) },
      );

      expect(response.status).toBe(400);
      expect(client.inserts).toEqual([]);
    },
  );
});

describe('B7 matrix — user library item PATCH/DELETE', () => {
  const update = vi.fn();
  const deleteFn = vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(async () => ({ error: null })),
    })),
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    update.mockReset();
    deleteFn.mockClear();
    mockGetSession.mockResolvedValue({ user: OWNER, error: null });
    mockStandardLimiterCheck.mockResolvedValue({
      success: true,
      remaining: 29,
      reset: Date.now() + 60_000,
    });
    const selectChain = {
      eq: vi.fn(function eq() {
        return selectChain;
      }),
      maybeSingle: vi.fn(async () => ({
        data: { id: 'lib-owned', user_id: OWNER.uid, name: 'Bolt', payload: {} },
        error: null,
      })),
    };
    mockCreateClient.mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => selectChain),
        update,
        delete: deleteFn,
      })),
    } as never);
  });

  it('PATCH returns 403 when Origin is missing without writing', async () => {
    const response = await patchUserLibraryItem(
      new NextRequest('http://localhost/api/user/library/powers/lib-owned', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      }),
      { params: Promise.resolve({ type: 'powers', id: 'lib-owned' }) },
    );

    expect(response.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it('DELETE returns 403 when Origin is missing without writing', async () => {
    const response = await deleteUserLibraryItem(
      new NextRequest('http://localhost/api/user/library/powers/lib-owned', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ type: 'powers', id: 'lib-owned' }) },
    );

    expect(response.status).toBe(403);
    expect(deleteFn).not.toHaveBeenCalled();
  });

  it('DELETE removes an owned library item when Origin is present', async () => {
    const response = await deleteUserLibraryItem(
      new NextRequest('http://localhost/api/user/library/powers/lib-owned', {
        method: 'DELETE',
        headers: { origin: 'http://localhost' },
      }),
      { params: Promise.resolve({ type: 'powers', id: 'lib-owned' }) },
    );

    expect(response.status).toBe(200);
    expect(deleteFn).toHaveBeenCalledTimes(1);
  });

  it('user library POST then GET returns the normalized persisted shape (powers)', async () => {
    const { client, getListedRow } = createUserLibraryRoundTripClient();
    mockCreateClient.mockResolvedValue(client as never);

    const validBody = VALID_OFFICIAL_BODY.powers;
    const postResponse = await postUserLibrary(
      new NextRequest('http://localhost/api/user/library/powers', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost' },
        body: JSON.stringify(validBody),
      }),
      { params: Promise.resolve({ type: 'powers' }) },
    );
    expect(postResponse.status).toBe(200);
    const postBody = (await postResponse.json()) as { id: string };
    const listedRow = getListedRow();
    expect(listedRow).not.toBeNull();
    expect(postBody.id).toBe(listedRow!.id);

    const getResponse = await getUserLibrary(
      new NextRequest('http://localhost/api/user/library/powers'),
      { params: Promise.resolve({ type: 'powers' }) },
    );
    expect(getResponse.status).toBe(200);
    const items = (await getResponse.json()) as Record<string, unknown>[];
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe(postBody.id);
    expect(items[0]?.id).toBe(getListedRow()!.id);
    expect(items[0]).toMatchObject({
      name: validBody.name,
      parts: [],
    });
    expect(items[0]).not.toHaveProperty('b7UnknownField');
  });
});
