/**
 * Admin Codex — write allowlist and key mapping.
 * Admin payloads arrive in mixed casing (`op_1_desc`, `imageId`); these helpers map them to
 * the DB column set each collection is allowed to write. `columnarDbColumns` exposes that
 * column set so the read/write parity test can compare it against the `/api/codex` projection.
 */

import type { CodexCollection } from '@/lib/codex/collections';

function snakeToCamel(s: string): string {
  // Handle common codex column patterns like op_1_desc -> op1Desc
  // so option fields survive the allowed-field filter.
  const normalized = s.replace(/_(\d+)/g, '$1');
  return normalized.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Admin payloads use snake_case like `op_1_desc`. COLUMNAR_FIELDS use `op1Desc` (digit in the
 * camel segment). Plain snakeToCamel leaves `op_1Desc`, which fails the allowlist and drops
 * option fields on insert/update.
 */
function columnarSourceKeyToCamel(collection: CodexCollection, key: string): string {
  if ((collection === 'codex_properties' || collection === 'codex_parts') && /^op_\d+_/.test(key)) {
    const m = key.match(/^op_(\d+)_(.+)$/);
    if (m) {
      const restCamel = snakeToCamel(m[2]);
      if (!restCamel) return snakeToCamel(key);
      return `op${m[1]}${restCamel.charAt(0).toUpperCase()}${restCamel.slice(1)}`;
    }
  }
  return snakeToCamel(key);
}

function camelToSnake(s: string): string {
  return s
    .replace(/([a-zA-Z])(\d)/g, '$1_$2')
    .replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * `codex_parts` / `codex_properties` separate the option index (`op_1_desc`), but
 * `codex_archetypes` keeps it attached (`level1_feats`, `power_prof_level5`). Splitting the
 * digit there produced columns that do not exist, so every archetype spreadsheet save failed.
 */
function camelToSnakeAttachedDigits(s: string): string {
  return s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function dbColumnName(collection: CodexCollection, key: string): string {
  return collection === 'codex_archetypes' ? camelToSnakeAttachedDigits(key) : camelToSnake(key);
}

/** Serialize value for columnar TEXT columns: arrays become comma-separated */
function toColumnValue(val: unknown): unknown {
  if (val == null) return null;
  if (Array.isArray(val)) return val.map(String).join(', ');
  if (typeof val === 'object' && !(val instanceof Date)) return JSON.stringify(val);
  return val;
}

export const COLUMNAR_FIELDS: Record<CodexCollection, string[]> = {
  codex_feats: ['name', 'description', 'reqDesc', 'abilityReq', 'abilReqVal', 'skillReq', 'skillReqVal', 'featCatReq', 'powAbilReq', 'martAbilReq', 'powProfReq', 'martProfReq', 'speedReq', 'featLvl', 'lvlReq', 'usesPerRec', 'recPeriod', 'category', 'ability', 'tags', 'charFeat', 'stateFeat', 'baseFeatId'],
  codex_skills: ['name', 'description', 'ability', 'baseSkill', 'baseSkillId', 'successDesc', 'failureDesc', 'dsCalc', 'craftFailureDesc', 'craftSuccessDesc'],
  codex_species: ['name', 'description', 'type', 'sizes', 'skills', 'speciesTraits', 'ancestryTraits', 'flaws', 'characteristics', 'aveHgtCm', 'aveWgtKg', 'aveHeight', 'aveWeight', 'adulthoodLifespan', 'languages', 'isStarter', 'imageId', 'imageUrl'],
  codex_traits: ['name', 'description', 'usesPerRec', 'recPeriod', 'flaw', 'characteristic', 'optionTraitIds'],
  codex_parts: ['name', 'description', 'category', 'baseEn', 'baseTp', 'op1Desc', 'op1En', 'op1Tp', 'op2Desc', 'op2En', 'op2Tp', 'op3Desc', 'op3En', 'op3Tp', 'type', 'mechanic', 'percentage', 'duration', 'defense'],
  codex_properties: ['name', 'description', 'baseIp', 'baseTp', 'baseC', 'op1Desc', 'op1Ip', 'op1Tp', 'op1C', 'type', 'mechanic'],
  codex_equipment: ['name', 'description', 'category', 'currency', 'rarity', 'imageId', 'imageUrl'],
  codex_archetypes: [
    'name',
    'type',
    'description',
    'archetypeAbility',
    'secondaryAbility',
    'powerProfStart',
    'martialProfStart',
    'powerProfLevel5',
    'martialProfLevel5',
    'level1Feats',
    'level1Skills',
    'level1Powers',
    'level1Techniques',
    'level1Armaments',
    'level1Equipment',
    'level1RemoveFeats',
    'level1RemovePowers',
    'level1RemoveTechniques',
    'level1RemoveArmaments',
    'level1Notes',
  ],
  codex_creature_feats: ['name', 'description', 'featPoints', 'featLvl', 'lvlReq', 'mechanic'],
  core_rules: [],
};

/** Build create/update payload from admin payload (snake_case, arrays). Output camelCase for toDbPayload. */
export function toColumnarPayload(
  collection: CodexCollection,
  data: Record<string, unknown>
): Record<string, unknown> {
  const allowed = new Set(COLUMNAR_FIELDS[collection] ?? []);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'id' || key === 'data') continue;
    const camel = columnarSourceKeyToCamel(collection, key);
    if (allowed.size > 0 && !allowed.has(camel)) continue;
    out[camel] = toColumnValue(value);
  }
  return out;
}

/** Convert camelCase payload to snake_case for Supabase (DB columns). Collection-specific aliases so API response keys round-trip to correct DB columns. */
export function toDbPayload(
  collection: CodexCollection,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (collection === 'codex_skills' && key === 'baseSkillId') {
      out.base_skill = value != null ? String(value) : null;
      continue;
    }
    if (collection === 'codex_species') {
      if (key === 'aveHeight') {
        out.ave_hgt_cm = value != null ? (typeof value === 'number' ? value : Number(value)) : null;
        continue;
      }
      if (key === 'aveWeight') {
        out.ave_wgt_kg = value != null ? (typeof value === 'number' ? value : Number(value)) : null;
        continue;
      }
    }
    out[dbColumnName(collection, key)] = value;
  }
  return out;
}

/** Every DB column this collection's write path can set, derived from the allowlist itself. */
export function columnarDbColumns(collection: CodexCollection): string[] {
  const camelPayload = Object.fromEntries(
    (COLUMNAR_FIELDS[collection] ?? []).map((field) => [field, null])
  );
  return Object.keys(toDbPayload(collection, camelPayload));
}
