/**
 * Whole-table codex reads for Admin > Sources (membership list by selected source).
 */

import type { CodexSourceTable } from '@/lib/codex/source-catalog';
import { CODEX_SOURCE_TABLES, sourcesColumnMissing } from '@/lib/codex/source-catalog';
import { fetchAllPostgrestPages } from '@/lib/codex/postgrest-pager';
import {
  codexSourceKey,
  codexSourcesOrCore,
  itemMatchesSources,
  normalizeCodexSources,
} from '@/lib/codex/sources';
import { createPublicClient } from '@/lib/supabase/public-client';

export const ADMIN_CODEX_SOURCE_SECTIONS: readonly {
  table: CodexSourceTable;
  label: string;
  labelMobile?: string;
}[] = [
  { table: 'codex_feats', label: 'Feats' },
  { table: 'codex_skills', label: 'Skills' },
  { table: 'codex_species', label: 'Species' },
  { table: 'codex_traits', label: 'Traits' },
  { table: 'codex_parts', label: 'Power & Technique Parts', labelMobile: 'Parts' },
  { table: 'codex_properties', label: 'Armament Properties', labelMobile: 'Properties' },
  { table: 'codex_equipment', label: 'Equipment' },
  { table: 'codex_archetypes', label: 'Archetypes' },
  { table: 'codex_creature_feats', label: 'Creature Feats' },
];

const ADMIN_SOURCE_ROW_SELECT = 'id, name, sources';

export type AdminCodexSourceRow = {
  id: string | number;
  name: string | null;
  sources?: unknown;
};

export type AdminCodexSourceRowsByTable = Partial<Record<CodexSourceTable, AdminCodexSourceRow[]>>;

export async function loadAdminCodexSourceRows(): Promise<AdminCodexSourceRowsByTable> {
  const client = createPublicClient();
  if (!client) throw new Error('Database client unavailable');

  const rowsByTable: AdminCodexSourceRowsByTable = {};
  const reads = await Promise.all(
    CODEX_SOURCE_TABLES.map(async (table) => {
      try {
        const data = await fetchAllPostgrestPages<AdminCodexSourceRow>(async (from, to) =>
          client.from(table).select(ADMIN_SOURCE_ROW_SELECT).range(from, to),
        );
        return { table, data, error: null as { code?: string; message?: string } | null };
      } catch (error) {
        return { table, data: null, error: error as { code?: string; message?: string } };
      }
    }),
  );

  for (const { table, data, error } of reads) {
    if (error) {
      if (sourcesColumnMissing(error)) continue;
      throw error;
    }
    rowsByTable[table] = data ?? [];
  }
  return rowsByTable;
}

export function rowsMatchingSource(
  rows: readonly AdminCodexSourceRow[] | undefined,
  selectedSource: string,
): AdminCodexSourceRow[] {
  if (!rows?.length) return [];
  return rows.filter((row) => itemMatchesSources(row.sources, [selectedSource]));
}

export function otherSourcesLabel(
  itemSources: unknown,
  selectedSource: string,
  catalogNames: readonly string[],
): string {
  const selectedKey = codexSourceKey(selectedSource);
  const others = codexSourcesOrCore(itemSources, catalogNames).filter(
    (name) => codexSourceKey(name) !== selectedKey,
  );
  return others.length > 0 ? others.join(', ') : '—';
}

export function catalogNameList(
  catalog: readonly { name: string }[],
  rowsByTable: AdminCodexSourceRowsByTable,
): string[] {
  const fromRows: string[] = [];
  for (const table of CODEX_SOURCE_TABLES) {
    for (const row of rowsByTable[table] ?? []) {
      fromRows.push(...normalizeCodexSources(row.sources));
    }
  }
  return normalizeCodexSources([...catalog.map((e) => e.name), ...fromRows]);
}
