/**
 * Codex Spreadsheet — tab/column config (TASK-617)
 */

export type CodexSpreadsheetTabId =
  | 'feats'
  | 'skills'
  | 'species'
  | 'traits'
  | 'parts'
  | 'properties'
  | 'equipment'
  | 'archetypes'
  | 'creature_feats';

export type CodexCollection =
  | 'codex_feats'
  | 'codex_skills'
  | 'codex_species'
  | 'codex_traits'
  | 'codex_parts'
  | 'codex_properties'
  | 'codex_equipment'
  | 'codex_archetypes'
  | 'codex_creature_feats';

export const TAB_CONFIG: Record<
  CodexSpreadsheetTabId,
  {
    apiKey:
      | 'feats'
      | 'skills'
      | 'species'
      | 'traits'
      | 'parts'
      | 'itemProperties'
      | 'equipment'
      | 'archetypes'
      | 'creatureFeats';
    collection: CodexCollection;
  }
> = {
  feats: { apiKey: 'feats', collection: 'codex_feats' },
  skills: { apiKey: 'skills', collection: 'codex_skills' },
  species: { apiKey: 'species', collection: 'codex_species' },
  traits: { apiKey: 'traits', collection: 'codex_traits' },
  parts: { apiKey: 'parts', collection: 'codex_parts' },
  properties: { apiKey: 'itemProperties', collection: 'codex_properties' },
  equipment: { apiKey: 'equipment', collection: 'codex_equipment' },
  archetypes: { apiKey: 'archetypes', collection: 'codex_archetypes' },
  creature_feats: { apiKey: 'creatureFeats', collection: 'codex_creature_feats' },
};

/** Preferred column order: id, name, description first, then known short/narrow columns, then rest alphabetically. */
const PREFERRED_ORDER_AFTER_DESC = [
  'flaw',
  'characteristic',
  'option_trait_ids',
  'rec_period',
  'uses_per_rec',
  'uses_per_rec_per_tier',
  'category',
  'type',
  'size',
  'speed',
  'skill_req',
  'skill_req_val',
  'ability_req',
  'abil_req_val',
  'char_feat',
  'state_feat',
  'tags',
  'lvl_req',
  'mechanic',
  'base_skill_id',
  'base_skill_id_alt',
  'sizes',
  'skills',
  'species_traits',
  'ancestry_traits',
  'characteristics',
  'flaws',
  'languages',
  'ave_height',
  'ave_weight',
  'adulthood_lifespan',
];

export function orderColumns(keys: string[]): string[] {
  const hasId = keys.includes('id');
  const hasName = keys.includes('name');
  const hasDesc = keys.includes('description');
  const rest = keys.filter((k) => k !== 'id' && k !== 'name' && k !== 'description');
  const ordered: string[] = [];
  if (hasId) ordered.push('id');
  if (hasName) ordered.push('name');
  if (hasDesc) ordered.push('description');
  const afterSet = new Set(PREFERRED_ORDER_AFTER_DESC);
  const preferred = PREFERRED_ORDER_AFTER_DESC.filter((k) => rest.includes(k));
  const remaining = rest.filter((k) => !afterSet.has(k)).sort();
  return [...ordered, ...preferred, ...remaining];
}

/** Known numeric columns (spreadsheet uses number input). */
export const NUMERIC_COLUMNS = new Set([
  'lvl_req',
  'uses_per_rec',
  'uses_per_rec_per_tier',
  'feat_lvl',
  'pow_abil_req',
  'mart_abil_req',
  'pow_prof_req',
  'mart_prof_req',
  'speed_req',
  'abil_req_val',
  'skill_req_val',
  'base_en',
  'base_tp',
  'op_1_en',
  'op_1_tp',
  'op_2_en',
  'op_2_tp',
  'op_3_en',
  'op_3_tp',
  'base_ip',
  'base_c',
  'op_1_ip',
  'op_1_tp',
  'op_1_c',
  'currency',
  'feat_points',
  'ave_height',
  'ave_weight',
  'adulthood_lifespan',
]);

/** Known boolean columns (spreadsheet uses checkbox). */
export const BOOLEAN_COLUMNS = new Set([
  'flaw',
  'characteristic',
  'char_feat',
  'state_feat',
  'percentage',
  'duration',
  'mechanic',
]);

/** Column width in px: narrow for id/boolean/short fields, wider for description. */
export function getColumnWidth(colKey: string, sampleValue: unknown): number {
  if (colKey === 'id') return 90;
  if (colKey === 'name') return 120;
  if (colKey === 'description') return 320;
  if (typeof sampleValue === 'boolean') return 56;
  const narrowKeys = [
    'rec_period',
    'uses_per_rec',
    'uses_per_rec_per_tier',
    'lvl_req',
    'speed',
    'flaw',
    'characteristic',
    'char_feat',
    'state_feat',
    'base_skill_id',
    'base_skill_id_alt',
  ];
  if (narrowKeys.includes(colKey)) return 72;
  if (colKey === 'category' || colKey === 'type' || colKey === 'size') return 88;
  return 140;
}

export const ACTIONS_COL_WIDTH = 112;
