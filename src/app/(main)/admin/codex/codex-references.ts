/**
 * Admin Codex — referential integrity probes for delete (F-13).
 * Codex cross-references are plain id strings in CSV TEXT columns, so a delete cannot be
 * caught by a foreign key. These probes describe which columns can point at each collection;
 * `deleteCodexDoc` runs them before removing a row and refuses until the admin acknowledges.
 */

import type { CodexCollection } from './codex-collections';

export type ReferenceProbe = {
  table: string;
  /** CSV / scalar id columns on `table` that can point at the deleted entity. */
  columns: string[];
  /** Columns fetched so a referencing row can be named in the confirmation. */
  selectColumns: string;
  describe: (row: Record<string, unknown>) => string;
};

function named(label: string) {
  return (row: Record<string, unknown>): string => {
    const name = typeof row.name === 'string' && row.name.trim() ? row.name.trim() : String(row.id ?? '');
    return `${label} "${name}"`;
  };
}

export const REFERENCE_PROBES: Partial<Record<CodexCollection, ReferenceProbe[]>> = {
  codex_feats: [
    { table: 'codex_feats', columns: ['base_feat_id'], selectColumns: 'id, name, base_feat_id', describe: named('Feat') },
    {
      table: 'codex_archetypes',
      columns: ['level1_feats', 'level1_remove_feats'],
      selectColumns: 'id, name, level1_feats, level1_remove_feats',
      describe: named('Archetype'),
    },
    {
      table: 'codex_archetype_levels',
      columns: ['feats', 'remove_feats'],
      selectColumns: 'id, archetype_id, level, feats, remove_feats',
      describe: (row) => `Archetype ${String(row.archetype_id ?? '')} level ${String(row.level ?? '')}`,
    },
  ],
  codex_skills: [
    { table: 'codex_feats', columns: ['skill_req'], selectColumns: 'id, name, skill_req', describe: named('Feat') },
    { table: 'codex_species', columns: ['skills'], selectColumns: 'id, name, skills', describe: named('Species') },
    {
      table: 'codex_archetypes',
      columns: ['level1_skills'],
      selectColumns: 'id, name, level1_skills',
      describe: named('Archetype'),
    },
    {
      table: 'codex_archetype_levels',
      columns: ['skills'],
      selectColumns: 'id, archetype_id, level, skills',
      describe: (row) => `Archetype ${String(row.archetype_id ?? '')} level ${String(row.level ?? '')}`,
    },
  ],
  codex_traits: [
    {
      table: 'codex_traits',
      columns: ['option_trait_ids'],
      selectColumns: 'id, name, option_trait_ids',
      describe: named('Trait'),
    },
    {
      table: 'codex_species',
      columns: ['species_traits', 'ancestry_traits', 'flaws', 'characteristics'],
      selectColumns: 'id, name, species_traits, ancestry_traits, flaws, characteristics',
      describe: named('Species'),
    },
  ],
  codex_equipment: [
    {
      table: 'codex_archetypes',
      columns: ['level1_equipment'],
      selectColumns: 'id, name, level1_equipment',
      describe: named('Archetype'),
    },
    {
      table: 'codex_archetype_levels',
      columns: ['equipment'],
      selectColumns: 'id, archetype_id, level, equipment',
      describe: (row) => `Archetype ${String(row.archetype_id ?? '')} level ${String(row.level ?? '')}`,
    },
  ],
};

/** Codex id lists are comma-separated TEXT, so membership must be exact per entry. */
export function csvIncludesId(value: unknown, id: string): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.some((entry) => String(entry).trim() === id);
  return String(value)
    .split(',')
    .some((entry) => entry.trim() === id);
}

export function findReferencesInRows(
  probe: ReferenceProbe,
  rows: Record<string, unknown>[],
  id: string
): string[] {
  const found: string[] = [];
  for (const row of rows) {
    for (const column of probe.columns) {
      if (csvIncludesId(row[column], id)) {
        found.push(`${probe.describe(row)} (${column})`);
        break;
      }
    }
  }
  return found;
}
