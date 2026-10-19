import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/public-client', () => ({
  createPublicClient: vi.fn(() => null),
}));

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn(),
}));

vi.mock('@/lib/core-rules-server', () => ({
  fetchCoreRules: vi.fn(async () => ({ PROGRESSION_PLAYER: { baseHealth: 8 } })),
}));

vi.mock('@/lib/entity-image-enrich-server', () => ({
  enrichRowsWithBankImageUrls: vi.fn(async () => undefined),
}));

import { GET } from './route';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { fetchCoreRules } from '@/lib/core-rules-server';
import { enrichRowsWithBankImageUrls } from '@/lib/entity-image-enrich-server';
import { CODEX_SKILLS_PUBLIC_SELECT } from '@/lib/codex/public-table-select';
import {
  PRIVATE_MUST_REVALIDATE_CACHE_CONTROL,
  PRIVATE_NO_STORE_CACHE_CONTROL,
  PUBLIC_CDN_CACHE_CONTROL,
} from '@/lib/api/public-cdn-cache';
import { createPublicClient } from '@/lib/supabase/public-client';
import { CODEX_PAYLOAD_KEYS, type CodexPayload } from '@/types/codex';

const mockCreateClient = vi.mocked(createClient);
const mockCreatePublicClient = vi.mocked(createPublicClient);
const mockGetSession = vi.mocked(getSession);
const mockIsAdmin = vi.mocked(isAdmin);
const mockFetchCoreRules = vi.mocked(fetchCoreRules);
const mockEnrichRows = vi.mocked(enrichRowsWithBankImageUrls);

const ROWS: Record<string, Record<string, unknown>[]> = {
  codex_feats: [{ id: 'feat-1', name: 'Cleave' }],
  codex_skills: [{ id: 'skill-1', name: 'Athletics', ability: 'STR' }],
  codex_species: [
    { id: 'species-1', name: 'Human', sizes: 'Medium', catalog_listing: 'listed' },
    { id: 'species-hidden', name: 'Admin Only', sizes: 'Medium', catalog_listing: 'unlisted' },
  ],
  codex_traits: [{ id: 'trait-1', name: 'Keen Sight' }],
  codex_parts: [
    { id: 'part-1', name: 'Damage', type: 'power' },
    { id: 'part-2', name: 'Feint', type: 'technique' },
  ],
  codex_properties: [{ id: 'prop-1', name: 'Heavy' }],
  codex_equipment: [{ id: 'equip-1', name: 'Rope', currency: 5 }],
  codex_archetypes: [{ id: 'arch-1', name: 'Guardian', type: 'martial' }],
  codex_archetype_levels: [{ archetype_id: 'arch-1', level: 2, feats: 'feat-1' }],
  codex_creature_feats: [{ id: 'cfeat-1', name: 'Pounce', feat_points: 2 }],
};

/** Records which tables the request actually queried. */
let queriedTables: string[] = [];
let lastSelectByTable: Record<string, string> = {};

function mockSupabase() {
  return {
    from: (table: string) => ({
      select: async (columns: string) => {
        queriedTables.push(table);
        lastSelectByTable[table] = columns;
        return { data: ROWS[table] ?? [], error: null };
      },
      in: async () => ({ data: [], error: null }),
    }),
  } as never;
}

async function getJson(url: string): Promise<Partial<CodexPayload>> {
  const response = await GET(new Request(url));
  return (await response.json()) as Partial<CodexPayload>;
}

describe('GET /api/codex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queriedTables = [];
    lastSelectByTable = {};
    mockFetchCoreRules.mockResolvedValue({
      PROGRESSION_PLAYER: { baseHealth: 8 },
    } as never);
    mockCreateClient.mockResolvedValue(mockSupabase());
    mockCreatePublicClient.mockReturnValue(null);
    mockIsAdmin.mockResolvedValue(false);
  });

  it('returns every collection when ?collection= is omitted', async () => {
    mockCreatePublicClient.mockReturnValue(mockSupabase() as never);
    const response = await GET(new Request('http://localhost/api/codex'));
    const body = (await response.json()) as Partial<CodexPayload>;

    expect(response.headers.get('Cache-Control')).toBe(PUBLIC_CDN_CACHE_CONTROL);
    expect(Object.keys(body).sort()).toEqual([...CODEX_PAYLOAD_KEYS].sort());
    expect(body.feats).toHaveLength(1);
    expect(body.species?.map((species) => species.id)).toEqual(['species-1']);
    expect(body.coreRules).toEqual({ PROGRESSION_PLAYER: { baseHealth: 8 } });
  });

  it('does not CDN-cache when the cookie-less client is unavailable', async () => {
    mockCreatePublicClient.mockReturnValue(null);
    const response = await GET(new Request('http://localhost/api/codex'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(PRIVATE_NO_STORE_CACHE_CONTROL);
  });

  it('does not CDN-cache an empty collection', async () => {
    mockCreatePublicClient.mockReturnValue({
      from: () => ({
        select: async () => ({ data: [], error: null }),
        in: async () => ({ data: [], error: null }),
      }),
    } as never);
    const response = await GET(new Request('http://localhost/api/codex?collection=feats'));
    expect(response.headers.get('Cache-Control')).toBe(PRIVATE_MUST_REVALIDATE_CACHE_CONTROL);
  });

  it('returns only the requested slice and only queries its table', async () => {
    const body = await getJson('http://localhost/api/codex?collection=feats');

    expect(Object.keys(body)).toEqual(['feats']);
    expect(body.feats?.[0]?.name).toBe('Cleave');
    expect(queriedTables).toEqual(['codex_feats']);
    expect(mockFetchCoreRules).not.toHaveBeenCalled();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('projects codex_skills columns instead of select(*)', async () => {
    await getJson('http://localhost/api/codex?collection=skills');
    expect(lastSelectByTable.codex_skills).toBe(CODEX_SKILLS_PUBLIC_SELECT);
  });

  it('loads skills from the legacy source column when the sources column is missing', async () => {
    mockCreateClient.mockResolvedValue({
      from: (table: string) => ({
        select: async (columns: string) => {
          queriedTables.push(table);
          lastSelectByTable[table] = columns;
          if (
            table === 'codex_skills' &&
            columns.split(',').some((part) => part.trim() === 'sources')
          ) {
            return {
              data: null,
              error: { code: '42703', message: 'column codex_skills.sources does not exist' },
            };
          }
          const rows = ROWS[table] ?? [];
          if (table === 'codex_skills') {
            return {
              data: rows.map((row) => ({ ...row, source: 'Crafting Expansion' })),
              error: null,
            };
          }
          return { data: rows, error: null };
        },
      }),
    } as never);

    const response = await GET(new Request('http://localhost/api/codex?collection=skills'));
    expect(response.status).toBe(200);
    const body = (await response.json()) as Partial<CodexPayload>;
    expect(body.skills).toHaveLength(1);
    expect(body.skills?.[0]?.name).toBe('Athletics');
    expect(body.skills?.[0]?.sources).toEqual(['Crafting Expansion']);
    expect(queriedTables.filter((table) => table === 'codex_skills')).toHaveLength(2);
  });

  it('returns an empty skills list when the table itself is missing', async () => {
    mockCreateClient.mockResolvedValue({
      from: (table: string) => ({
        select: async (columns: string) => {
          queriedTables.push(table);
          lastSelectByTable[table] = columns;
          if (table === 'codex_skills') {
            return {
              data: null,
              error: { code: '42P01', message: 'relation "public.codex_skills" does not exist' },
            };
          }
          return { data: ROWS[table] ?? [], error: null };
        },
      }),
    } as never);

    const response = await GET(new Request('http://localhost/api/codex?collection=skills'));
    expect(response.status).toBe(200);
    const body = (await response.json()) as Partial<CodexPayload>;
    expect(body.skills).toEqual([]);
  });

  it('reads both archetype tables for the archetypes slice', async () => {
    const body = await getJson('http://localhost/api/codex?collection=archetypes');

    expect(Object.keys(body)).toEqual(['archetypes']);
    expect(queriedTables.sort()).toEqual(['codex_archetype_levels', 'codex_archetypes']);

    const archetype = body.archetypes?.[0];
    expect(archetype?.name).toBe('Guardian');
    const pathData = archetype?.path_data as
      | { levels?: { level?: number | undefined }[] }
      | undefined;
    expect(pathData?.levels?.[0]?.level).toBe(2);
  });

  it('does not set public CDN cache when coreRules is empty (86e3rb7ca)', async () => {
    mockCreatePublicClient.mockReturnValue(mockSupabase() as never);
    mockFetchCoreRules.mockResolvedValue({} as never);
    const response = await GET(new Request('http://localhost/api/codex?collection=coreRules'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=0, must-revalidate');
  });

  it('serves coreRules without touching codex tables', async () => {
    const body = await getJson('http://localhost/api/codex?collection=coreRules');

    expect(Object.keys(body)).toEqual(['coreRules']);
    expect(queriedTables).toEqual([]);
    expect(mockFetchCoreRules).toHaveBeenCalledTimes(1);
  });

  it('splits power and technique parts from one codex_parts read', async () => {
    const parts = await getJson('http://localhost/api/codex?collection=parts');
    expect(queriedTables).toEqual(['codex_parts']);
    expect(parts.parts).toHaveLength(2);

    queriedTables = [];
    const powerParts = await getJson('http://localhost/api/codex?collection=powerParts');
    expect(Object.keys(powerParts)).toEqual(['powerParts']);
    expect(powerParts.powerParts?.map((part) => part.id)).toEqual(['part-1']);
  });

  it('hides unlisted species from public catalog reads', async () => {
    const body = await getJson('http://localhost/api/codex?collection=species');
    expect(body.species?.map((s) => s.id)).toEqual(['species-1']);
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('keeps unlisted species hidden when includeUnlisted=1 without admin', async () => {
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });
    const body = await getJson('http://localhost/api/codex?collection=species&includeUnlisted=1');
    expect(body.species?.map((s) => s.id)).toEqual(['species-1']);
    expect(mockGetSession).toHaveBeenCalled();
  });

  it('includes unlisted species for an admin with includeUnlisted=1', async () => {
    mockGetSession.mockResolvedValue({
      user: { uid: 'admin-1', email: 'admin@example.com' },
      error: null,
    });
    mockIsAdmin.mockResolvedValue(true);
    const response = await GET(
      new Request('http://localhost/api/codex?collection=species&includeUnlisted=1'),
    );
    const body = (await response.json()) as Partial<CodexPayload>;
    expect(body.species?.map((s) => s.id)).toEqual(['species-1', 'species-hidden']);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('rejects an unknown collection without echoing the value', async () => {
    const response = await GET(new Request('http://localhost/api/codex?collection=secrets'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Unknown codex collection' });
    expect(queriedTables).toEqual([]);
  });

  it('returns byte-identical JSON for repeated full payload reads', async () => {
    const first = await GET(new Request('http://localhost/api/codex'));
    const enrichCallsAfterFirst = mockEnrichRows.mock.calls.length;
    expect(enrichCallsAfterFirst).toBeGreaterThan(0);
    const second = await GET(new Request('http://localhost/api/codex'));
    const body1 = await first.text();
    const body2 = await second.text();
    expect(body1).toBe(body2);
    expect(mockEnrichRows.mock.calls.length).toBe(enrichCallsAfterFirst);
  });

  it('does not memoize an empty feats collection', async () => {
    mockCreateClient.mockResolvedValue({
      from: (table: string) => ({
        select: async (columns: string) => {
          queriedTables.push(table);
          lastSelectByTable[table] = columns;
          return { data: [], error: null };
        },
        in: async () => ({ data: [], error: null }),
      }),
    } as never);

    await GET(new Request('http://localhost/api/codex?collection=feats'));
    await GET(new Request('http://localhost/api/codex?collection=feats'));

    expect(queriedTables.filter((table) => table === 'codex_feats')).toHaveLength(2);
  });

  it('does not leak debug details to anonymous callers in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mockGetSession.mockResolvedValue({ user: null, error: 'No session' });
    mockCreateClient.mockRejectedValue(new Error('secret connection string'));

    try {
      const response = await GET(new Request('http://localhost/api/codex?debug=1'));
      expect(response.status).toBe(500);
      expect(response.headers.get('Cache-Control')).toBe(PRIVATE_NO_STORE_CACHE_CONTROL);
      await expect(response.json()).resolves.toEqual({ error: 'Failed to load codex' });
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
