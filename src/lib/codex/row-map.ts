/**
 * Shared Codex DB-row → typed entity mappers (TASK-777).
 *
 * Used by GET /api/codex and getCharacterViewEnrichment so a missed field cannot
 * blank an RM/other-user sheet row while Codex browse shows it. Route-only
 * fields (row version / admin lock) stay on the route.
 */

import { normalizeFeatAbilities } from '@/lib/codex/feat-ability';
import { mapCodexBaseSkillToId } from '@/lib/game/character-legality';
import type {
  CodexCreatureFeat,
  CodexEquipmentItem,
  CodexFeat,
  CodexItemProperty,
  CodexPart,
  CodexSkill,
  CodexSpecies,
  CodexTrait,
} from '@/types/codex';

type CodexDbRow = Record<string, unknown>;

export function toStrArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function toNumArray(val: unknown): number[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number).filter((n) => !Number.isNaN(n));
  if (typeof val === 'number') return [val];
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !Number.isNaN(n));
  }
  return [];
}

export function toNum(val: unknown): number | undefined {
  if (val == null || val === '') return undefined;
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
}

function asString(val: unknown, fallback = ''): string {
  if (val == null) return fallback;
  return String(val);
}

function optionalString(val: unknown): string | undefined {
  if (val == null || val === '') return undefined;
  const s = String(val);
  return s || undefined;
}

function optionalImage(val: unknown): string | null {
  return typeof val === 'string' && val.trim() ? val.trim() : null;
}

function toAdulthoodLifespan(val: unknown): number[] | undefined {
  if (val == null) return undefined;
  if (typeof val === 'string') {
    const arr = toNumArray(val);
    return arr.length ? arr : undefined;
  }
  if (Array.isArray(val)) {
    const arr = val.map(Number).filter((n) => !Number.isNaN(n));
    return arr.length ? arr : undefined;
  }
  if (typeof val === 'number' && !Number.isNaN(val)) return [val, val];
  return undefined;
}

export function mapCodexFeat(r: CodexDbRow): CodexFeat {
  const ability = normalizeFeatAbilities(r.ability as string | string[] | null | undefined);
  return {
    id: asString(r.id),
    name: asString(r.name),
    description: asString(r.description),
    category: asString(r.category),
    ability: ability.length > 0 ? ability : undefined,
    ability_req: toStrArray(r.ability_req),
    abil_req_val: toNumArray(r.abil_req_val),
    tags: toStrArray(r.tags),
    skill_req: toStrArray(r.skill_req),
    skill_req_val: toNumArray(r.skill_req_val),
    // Absent stays undefined (not 0): hard lvl_req vs half-pattern is distinct.
    lvl_req: toNum(r.lvl_req) as number,
    uses_per_rec: toNum(r.uses_per_rec) as number,
    mart_abil_req: toNum(r.mart_abil_req),
    char_feat: Boolean(r.char_feat),
    state_feat: Boolean(r.state_feat),
    rec_period: optionalString(r.rec_period),
    req_desc: optionalString(r.req_desc),
    feat_cat_req: optionalString(r.feat_cat_req),
    pow_abil_req: toNum(r.pow_abil_req),
    pow_prof_req: toNum(r.pow_prof_req),
    mart_prof_req: toNum(r.mart_prof_req),
    speed_req: toNum(r.speed_req),
    feat_lvl: toNum(r.feat_lvl),
    base_feat_id:
      r.base_feat_id != null && r.base_feat_id !== '' ? String(r.base_feat_id) : undefined,
  };
}

export function mapCodexSkill(r: CodexDbRow): CodexSkill {
  return {
    id: asString(r.id),
    name: asString(r.name),
    description: asString(r.description),
    ability: asString(r.ability),
    base_skill_id: mapCodexBaseSkillToId(r.base_skill),
    success_desc: optionalString(r.success_desc),
    failure_desc: optionalString(r.failure_desc),
    ds_calc: optionalString(r.ds_calc),
    craft_success_desc: optionalString(r.craft_success_desc),
    craft_failure_desc: optionalString(r.craft_failure_desc),
  };
}

export function mapCodexSpecies(r: CodexDbRow): CodexSpecies {
  const sizes = toStrArray(r.sizes);
  const speciesTraits = toStrArray(r.species_traits);
  return {
    id: asString(r.id),
    name: asString(r.name),
    description: asString(r.description),
    type: asString(r.type),
    size: sizes[0] || 'Medium',
    sizes,
    speed: 6,
    traits: speciesTraits,
    species_traits: speciesTraits,
    ancestry_traits: toStrArray(r.ancestry_traits),
    flaws: toStrArray(r.flaws),
    characteristics: toStrArray(r.characteristics),
    skills: toStrArray(r.skills),
    languages: toStrArray(r.languages),
    ave_height: r.ave_hgt_cm != null ? toNum(r.ave_hgt_cm) : undefined,
    ave_weight: r.ave_wgt_kg != null ? toNum(r.ave_wgt_kg) : undefined,
    adulthood_lifespan: toAdulthoodLifespan(r.adulthood_lifespan),
    is_starter: r.is_starter === true,
    image_url: optionalImage(r.image_url),
    image_id: optionalImage(r.image_id),
  };
}

export function mapCodexTrait(r: CodexDbRow): CodexTrait {
  return {
    id: asString(r.id),
    name: asString(r.name),
    description: asString(r.description),
    species: [],
    uses_per_rec: toNum(r.uses_per_rec),
    rec_period: optionalString(r.rec_period),
    flaw: r.flaw === true,
    characteristic: r.characteristic === true,
    option_trait_ids: toStrArray(r.option_trait_ids),
  };
}

export function mapCodexPart(r: CodexDbRow): CodexPart {
  const type = asString(r.type, 'power').toLowerCase();
  return {
    id: asString(r.id),
    name: asString(r.name),
    description: asString(r.description),
    category: asString(r.category),
    type,
    base_en: toNum(r.base_en) as number,
    base_tp: toNum(r.base_tp) as number,
    op_1_desc: optionalString(r.op_1_desc),
    op_1_en: toNum(r.op_1_en),
    op_1_tp: toNum(r.op_1_tp),
    op_2_desc: optionalString(r.op_2_desc),
    op_2_en: toNum(r.op_2_en),
    op_2_tp: toNum(r.op_2_tp),
    op_3_desc: optionalString(r.op_3_desc),
    op_3_en: toNum(r.op_3_en),
    op_3_tp: toNum(r.op_3_tp),
    percentage: r.percentage === true,
    mechanic: r.mechanic === true,
    duration: r.duration === true,
    defense: toStrArray(r.defense),
  };
}

export function mapCodexProperty(r: CodexDbRow): CodexItemProperty {
  return {
    id: asString(r.id),
    name: asString(r.name),
    description: asString(r.description),
    type: r.type == null || r.type === '' ? undefined : (r.type as CodexItemProperty['type']),
    tp_cost: 0,
    gold_cost: 0,
    base_ip: toNum(r.base_ip),
    base_tp: toNum(r.base_tp),
    base_c: toNum(r.base_c),
    op_1_desc: optionalString(r.op_1_desc),
    op_1_ip: toNum(r.op_1_ip),
    op_1_tp: toNum(r.op_1_tp),
    op_1_c: toNum(r.op_1_c),
    mechanic: r.mechanic === true,
  };
}

export function mapCodexEquipment(r: CodexDbRow): CodexEquipmentItem {
  const cost = toNum(r.currency) ?? 0;
  return {
    id: asString(r.id),
    name: asString(r.name),
    type: 'equipment',
    category: optionalString(r.category),
    description: asString(r.description),
    gold_cost: cost,
    currency: cost,
    properties: [],
    rarity: optionalString(r.rarity),
    image_url: optionalImage(r.image_url),
    image_id: optionalImage(r.image_id),
  };
}

export function mapCodexCreatureFeat(r: CodexDbRow): CodexCreatureFeat {
  const pointsVal = toNum(r.feat_points);
  return {
    id: asString(r.id),
    name: asString(r.name),
    description: asString(r.description),
    points: pointsVal as number,
    feat_points: pointsVal,
    feat_lvl: toNum(r.feat_lvl),
    lvl_req: toNum(r.lvl_req),
    mechanic: r.mechanic === true,
    prereqs: [],
  };
}
