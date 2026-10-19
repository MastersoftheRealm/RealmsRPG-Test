/**
 * Pure helpers for the Admin > Sources list. The server read lives in
 * `admin-source-rows.ts` so this module stays out of the client bundle's
 * Supabase and Data Cache graph.
 */

import type { CodexSourceTable } from '@/lib/codex/source-catalog';
import {
  CORE_CODEX_SOURCE,
  codexSourceKey,
  codexSourcesOrCore,
  itemMatchesSources,
  normalizeCodexSources,
  resolveCodexSourceName,
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
  updated_at?: string | null;
  feat_lvl?: number | null;
  type?: string | null;
  category?: string | null;
};

/** Optional row fields loaded for disambiguation in the admin list (read-only). */
const ADMIN_SOURCE_ROW_DETAIL_FIELD: Partial<
  Record<CodexSourceTable, 'feat_lvl' | 'type' | 'category'>
> = {
  codex_feats: 'feat_lvl',
  codex_creature_feats: 'feat_lvl',
  codex_species: 'type',
  codex_parts: 'type',
  codex_properties: 'type',
  codex_archetypes: 'type',
  codex_equipment: 'category',
};

export type AdminSourceRowDetail = {
  field: string;
  value: string;
};

export function adminSourceRowDetail(
  table: CodexSourceTable,
  row: AdminCodexSourceRow,
): AdminSourceRowDetail | null {
  const field = ADMIN_SOURCE_ROW_DETAIL_FIELD[table];
  if (!field) return null;
  const raw = row[field];
  if (raw == null || raw === '') return null;
  const value = typeof raw === 'number' ? String(raw) : String(raw).trim();
  if (!value) return null;
  return { field, value };
}

export function resolveAdminSelectedSource(input: {
  pickedSource: string;
  catalog: readonly { name: string }[];
  sessionDraftSources: readonly string[];
  catalogNames: readonly string[];
}): string {
  const { pickedSource, catalog, sessionDraftSources, catalogNames } = input;
  const draft = pickedSource.trim();
  if (draft) return resolveCodexSourceName(pickedSource, catalogNames);

  const coreFromCatalog = catalog.find(
    (entry) => codexSourceKey(entry.name) === codexSourceKey(CORE_CODEX_SOURCE),
  );
  if (coreFromCatalog) return coreFromCatalog.name;

  const coreFromNames = catalogNames.find(
    (name) => codexSourceKey(name) === codexSourceKey(CORE_CODEX_SOURCE),
  );
  if (coreFromNames) return coreFromNames;

  if (catalog[0]?.name) return catalog[0].name;
  return sessionDraftSources[0] ?? '';
}

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
