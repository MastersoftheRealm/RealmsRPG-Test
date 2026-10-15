/** Codex tables behind GET /api/codex whole-table reads. */
export const CODEX_DATA_TABLES = [
  'codex_feats',
  'codex_skills',
  'codex_species',
  'codex_traits',
  'codex_parts',
  'codex_properties',
  'codex_equipment',
  'codex_archetypes',
  'codex_archetype_levels',
  'codex_creature_feats',
] as const;

export type CodexDataTable = (typeof CODEX_DATA_TABLES)[number];
