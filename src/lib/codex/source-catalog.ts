/**
 * Distinct rules-source names derived from the nine codex `sources` columns.
 * There is no sources table. Admin writes invalidate this through `codex-api`.
 */

import { CODEX_API_CACHE_TAG } from '@/lib/codex/cache-tags';
import { COLUMNAR_COLLECTIONS, type CodexCollection } from '@/lib/codex/collections';
import { CORE_CODEX_SOURCE, codexSourcesOrCore, normalizeCodexSources } from '@/lib/codex/sources';
import { CODEX_PUBLIC_ISR_SECONDS, readCachedPublicData } from '@/lib/supabase/cached-public-read';
import { createPublicClient } from '@/lib/supabase/public-client';
import { fetchAllPostgrestPages } from '@/lib/codex/postgrest-pager';

export type CodexSourceTable = Exclude<CodexCollection, 'core_rules'>;

export const CODEX_SOURCE_TABLES: readonly CodexSourceTable[] = COLUMNAR_COLLECTIONS.filter(
  (table): table is CodexSourceTable => table !== 'core_rules',
);

export interface CodexSourceCatalogEntry {
  name: string;
  counts: Partial<Record<CodexSourceTable, number>>;
  total: number;
}

type SourceRow = { sources?: unknown };

/**
 * A missing `sources` column is an empty read, not a hard failure.
 * This select is only `sources`, so Postgres 42703 is that column.
 * PostgREST reports the same gap as PGRST204 before it reaches Postgres.
 */
export function sourcesColumnMissing(error: {
  code?: string | null;
  message?: string | null;
}): boolean {
  if (error.code === '42703') return true;
  const message = error.message ?? '';
  if (!/\bsources\b/i.test(message)) return false;
  return (
    error.code === 'PGRST204' ||
    /does not exist/i.test(message) ||
    /could not find the 'sources' column/i.test(message)
  );
}

/**
 * One sorted catalog. Spellings that differ only by case collapse, preferring
 * a non-lowercase spelling when one is present. Counts are rows per table.
 */
export function compileCodexSourceCatalog(
  rowsByTable: Partial<Record<string, readonly SourceRow[]>>,
): CodexSourceCatalogEntry[] {
  const seen: string[] = [];
  for (const table of CODEX_SOURCE_TABLES) {
    for (const row of rowsByTable[table] ?? []) {
      const names = normalizeCodexSources(row.sources);
      seen.push(...(names.length > 0 ? names : [CORE_CODEX_SOURCE]));
    }
  }
  const known = normalizeCodexSources(seen);
  const entries = new Map<string, CodexSourceCatalogEntry>();

  for (const table of CODEX_SOURCE_TABLES) {
    const rows = rowsByTable[table];
    if (!rows) continue;
    for (const row of rows) {
      for (const name of codexSourcesOrCore(row.sources, known)) {
        const key = name.toLowerCase();
        const entry = entries.get(key) ?? { name, counts: {}, total: 0 };
        entry.counts[table] = (entry.counts[table] ?? 0) + 1;
        entry.total += 1;
        entries.set(key, entry);
      }
    }
  }

  return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function loadCodexSourceCatalog(): Promise<CodexSourceCatalogEntry[]> {
  const client = createPublicClient();
  if (!client) return [];

  const reads = await Promise.all(
    CODEX_SOURCE_TABLES.map(async (table) => {
      try {
        const data = await fetchAllPostgrestPages<SourceRow>(async (from, to) =>
          client.from(table).select('id, sources').order('id', { ascending: true }).range(from, to),
        );
        return { table, data, error: null as { code?: string; message?: string } | null };
      } catch (error) {
        return { table, data: null, error: error as { code?: string; message?: string } };
      }
    }),
  );
  const rowsByTable: Partial<Record<CodexSourceTable, SourceRow[]>> = {};
  for (const { table, data, error } of reads) {
    if (error) {
      if (sourcesColumnMissing(error)) continue;
      throw error;
    }
    rowsByTable[table] = data ?? [];
  }
  return compileCodexSourceCatalog(rowsByTable);
}

export function getCodexSourceCatalog(): Promise<CodexSourceCatalogEntry[]> {
  return readCachedPublicData(
    // `paged-by-id` drops a catalog cached before the range read, which could stop at 1000 rows.
    ['codex-source-catalog', 'paged-by-id'],
    [CODEX_API_CACHE_TAG],
    CODEX_PUBLIC_ISR_SECONDS,
    loadCodexSourceCatalog,
  );
}
