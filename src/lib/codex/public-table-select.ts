/**
 * Column projections for whole-table codex reads (egress vs row-map mappers).
 */

import type { CodexDataTable } from '@/lib/codex/codex-tables';

export const CODEX_SKILLS_PUBLIC_SELECT =
  'id, name, description, ability, source, sources, base_skill, success_desc, failure_desc, ds_calc, craft_success_desc, craft_failure_desc, updated_at';

export const CODEX_PROPERTIES_PUBLIC_SELECT =
  'id, name, description, source, sources, type, base_ip, base_tp, base_c, op_1_desc, op_1_ip, op_1_tp, op_1_c, mechanic, updated_at';

/**
 * Named selects include `sources` before `sql/codex-entry-sources.sql` is applied.
 * Drop that one column and keep `source`, so the read can use the legacy label.
 */
export function omitCodexSourcesColumn(select: string): string {
  return select
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== 'sources')
    .join(', ');
}

/** Per-table select for GET /api/codex whole-table reads. */
export const CODEX_API_TABLE_SELECT: Record<CodexDataTable, string> = {
  codex_feats: '*',
  codex_skills: CODEX_SKILLS_PUBLIC_SELECT,
  codex_species: '*',
  codex_traits: '*',
  codex_parts: '*',
  codex_properties: CODEX_PROPERTIES_PUBLIC_SELECT,
  codex_equipment: '*',
  codex_archetypes: '*',
  codex_archetype_levels: '*',
  codex_creature_feats: '*',
};
