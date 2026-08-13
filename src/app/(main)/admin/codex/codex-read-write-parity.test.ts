/**
 * Read/write parity for every codex entity type.
 *
 * The admin editors write through the allowlist in `codex-column-map.ts` but read through the
 * hand-written projection in `/api/codex`. When a column is writable and not readable, the form
 * loads it blank and writes the blank back: that is how `codex_feats.mart_prof_req` became
 * unauthorable while 30 feats still held a value. This test drives the real projection with a
 * recording row proxy and fails when any writable column is never read.
 */

import { describe, expect, it, beforeAll, vi } from 'vitest';
import { COLUMNAR_COLLECTIONS } from '@/lib/codex/collections';
import { columnarDbColumns } from './codex-column-map';
import { buildArchetypeLevelRows, buildArchetypeRow } from './codex-archetype-write';

const columnReads = new Map<string, Set<string>>();

/** Join keys need a value or the projection drops the row before reading its other columns. */
const LINK_COLUMNS = new Set(['id', 'archetype_id']);

function recordingRow(table: string): Record<string, unknown> {
  let accessed = columnReads.get(table);
  if (!accessed) {
    accessed = new Set<string>();
    columnReads.set(table, accessed);
  }
  const seen = accessed;
  return new Proxy({} as Record<string, unknown>, {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      seen.add(prop);
      return LINK_COLUMNS.has(prop) ? '1' : undefined;
    },
  });
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: (table: string) => ({
      select: async () => ({ data: [recordingRow(table)], error: null }),
    }),
  })),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/entity-image-enrich-server', () => ({
  enrichRowsWithBankImageUrls: vi.fn(async () => undefined),
}));

vi.mock('@/lib/supabase/session', () => ({ getSession: vi.fn(async () => ({ user: null })) }));
vi.mock('@/lib/admin', () => ({ isAdmin: vi.fn(async () => false) }));

import { GET } from '@/app/api/codex/route';

const SAMPLE_ARCHETYPE = {
  name: 'Sample',
  type: 'martial' as const,
  levels: [{ level: 2 }],
};

/** Every table the admin write paths touch, with the columns each of them can set. */
const WRITE_TARGETS: Array<{ table: string; columns: string[] }> = [
  ...COLUMNAR_COLLECTIONS.filter((collection) => collection !== 'core_rules').map((collection) => ({
    table: collection,
    columns: columnarDbColumns(collection),
  })),
  { table: 'codex_archetypes', columns: Object.keys(buildArchetypeRow('1', SAMPLE_ARCHETYPE)) },
  {
    table: 'codex_archetype_levels',
    columns: Object.keys(buildArchetypeLevelRows('1', SAMPLE_ARCHETYPE.levels)[0]),
  },
];

describe('codex read/write column parity', () => {
  beforeAll(async () => {
    const response = await GET(new Request('http://localhost/api/codex'));
    expect(response.status).toBe(200);
  });

  it.each(WRITE_TARGETS)('$table exposes every writable column through /api/codex', ({ table, columns }) => {
    const readColumns = columnReads.get(table) ?? new Set<string>();
    const writeOnly = columns.filter((column) => !readColumns.has(column));
    expect(writeOnly).toEqual([]);
  });

  it('covers every columnar collection', () => {
    const covered = new Set(WRITE_TARGETS.map((target) => target.table));
    const missing = COLUMNAR_COLLECTIONS.filter((collection) => !covered.has(collection));
    expect(missing).toEqual([]);
  });
});
