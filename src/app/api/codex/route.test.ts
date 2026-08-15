import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/core-rules-server', () => ({
  fetchCoreRules: vi.fn(async () => ({ PROGRESSION_PLAYER: { baseHealth: 8 } })),
}));

import { GET } from './route';
import { createClient } from '@/lib/supabase/server';
import { fetchCoreRules } from '@/lib/core-rules-server';
import { CODEX_PAYLOAD_KEYS, type CodexPayload } from '@/types/codex';

const mockCreateClient = vi.mocked(createClient);
const mockFetchCoreRules = vi.mocked(fetchCoreRules);

const ROWS: Record<string, Record<string, unknown>[]> = {
  codex_feats: [{ id: 'feat-1', name: 'Cleave' }],
  codex_skills: [{ id: 'skill-1', name: 'Athletics', ability: 'STR' }],
  codex_species: [{ id: 'species-1', name: 'Human', sizes: 'Medium' }],
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

function mockSupabase() {
  return {
    from: (table: string) => ({
      select: async () => {
        queriedTables.push(table);
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
    mockFetchCoreRules.mockResolvedValue({
      PROGRESSION_PLAYER: { baseHealth: 8 },
    } as never);
    mockCreateClient.mockResolvedValue(mockSupabase());
  });

  it('returns every collection when ?collection= is omitted', async () => {
    const body = await getJson('http://localhost/api/codex');

    expect(Object.keys(body).sort()).toEqual([...CODEX_PAYLOAD_KEYS].sort());
    expect(body.feats).toHaveLength(1);
    expect(body.coreRules).toEqual({ PROGRESSION_PLAYER: { baseHealth: 8 } });
  });

  it('returns only the requested slice and only queries its table', async () => {
    const body = await getJson('http://localhost/api/codex?collection=feats');

    expect(Object.keys(body)).toEqual(['feats']);
    expect(body.feats?.[0]?.name).toBe('Cleave');
    expect(queriedTables).toEqual(['codex_feats']);
    expect(mockFetchCoreRules).not.toHaveBeenCalled();
  });

  it('reads both archetype tables for the archetypes slice', async () => {
    const body = await getJson('http://localhost/api/codex?collection=archetypes');

    expect(Object.keys(body)).toEqual(['archetypes']);
    expect(queriedTables.sort()).toEqual(['codex_archetype_levels', 'codex_archetypes']);

    const archetype = body.archetypes?.[0];
    expect(archetype?.name).toBe('Guardian');
    const pathData = archetype?.path_data as { levels?: { level?: number }[] } | undefined;
    expect(pathData?.levels?.[0]?.level).toBe(2);
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

  it('rejects an unknown collection without echoing the value', async () => {
    const response = await GET(new Request('http://localhost/api/codex?collection=secrets'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Unknown codex collection' });
    expect(queriedTables).toEqual([]);
  });
});
