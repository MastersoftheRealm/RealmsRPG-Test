/**
 * Pure helpers for the Admin > Sources list. The server read lives in
 * `admin-source-rows.ts` so this module stays out of the client bundle's
 * Supabase and Data Cache graph.
 */

import type { CodexSourceTable } from '@/lib/codex/source-catalog';
import {
  codexSourceKey,
  codexSourcesOrCore,
  itemMatchesSources,
  normalizeCodexSources,
} from '@/lib/codex/sources';

export type { CodexSourceTable };

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

export type AdminCodexSourceRow = {
  id: string | number;
  name: string | null;
  sources?: unknown;
};

export type AdminCodexSourceRowsByTable = Partial<Record<CodexSourceTable, AdminCodexSourceRow[]>>;

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
  for (const section of ADMIN_CODEX_SOURCE_SECTIONS) {
    for (const row of rowsByTable[section.table] ?? []) {
      fromRows.push(...normalizeCodexSources(row.sources));
    }
  }
  return normalizeCodexSources([...catalog.map((e) => e.name), ...fromRows]);
}
