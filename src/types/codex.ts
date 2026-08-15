/**
 * Codex API Types
 * ===============
 * Canonical typed payload for `/api/codex` (HYG-01 / TASK-378).
 * Collection entity shapes match `src/lib/codex/row-map.ts` (GET `/api/codex` + view enrichment).
 * Archetype path join stays in the route.
 */

import type { Archetype, PathGuidanceGroup } from './archetype';

// =============================================================================
// Entity types (codex collections)
// =============================================================================

/**
 * Row version carried through `/api/codex` so admin saves can send the value they loaded
 * and be rejected when another admin has written since. Absent until the table has the column.
 */
export interface CodexRowVersion {
  updated_at?: string;
}

export interface CodexPowerPart extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  category: string;
  base_en: number;
  base_tp: number;
  op_1_desc?: string;
  op_1_en?: number;
  op_1_tp?: number;
  op_2_desc?: string;
  op_2_en?: number;
  op_2_tp?: number;
  op_3_desc?: string;
  op_3_en?: number;
  op_3_tp?: number;
  duration?: boolean;
  percentage?: boolean;
  mechanic?: boolean;
  /** Targeted defenses (subset of the 6 canonical defenses). */
  defense?: string[];
  type?: string;
}

export interface CodexTechniquePart extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  category: string;
  base_tp: number;
  base_en?: number;
  op_1_desc?: string;
  op_1_en?: number;
  op_1_tp?: number;
  op_2_desc?: string;
  op_2_en?: number;
  op_2_tp?: number;
  op_3_desc?: string;
  op_3_en?: number;
  op_3_tp?: number;
  percentage?: boolean;
  mechanic?: boolean;
  type?: string;
}

export type CodexPart = CodexPowerPart & { type: 'power' | 'technique' | string };

export interface CodexItemProperty extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  type?: 'weapon' | 'armor' | 'shield' | 'general';
  tp_cost?: number;
  gold_cost?: number;
  base_ip?: number;
  base_tp?: number;
  base_c?: number;
  op_1_desc?: string;
  op_1_ip?: number;
  op_1_tp?: number;
  op_1_c?: number;
  mechanic?: boolean;
}

export interface CodexFeat extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  category: string;
  ability?: string[];
  ability_req: string[];
  abil_req_val: number[];
  tags: string[];
  skill_req: string[];
  skill_req_val: number[];
  lvl_req: number;
  uses_per_rec: number;
  mart_abil_req?: number | string;
  char_feat: boolean;
  state_feat: boolean;
  rec_period?: string;
  feat_lvl?: number;
  base_feat_id?: string;
  req_desc?: string;
  feat_cat_req?: string;
  pow_abil_req?: number;
  pow_prof_req?: number;
  mart_prof_req?: number;
  speed_req?: number;
}

export interface CodexSkill extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  ability: string;
  base_skill_id?: number;
  success_desc?: string;
  failure_desc?: string;
  ds_calc?: string;
  craft_success_desc?: string;
  craft_failure_desc?: string;
}

export interface CodexSpecies extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  type: string;
  size: string;
  sizes: string[];
  speed: number;
  traits: string[];
  species_traits: string[];
  ancestry_traits: string[];
  flaws: string[];
  characteristics: string[];
  skills: string[];
  languages: string[];
  ability_bonuses?: Record<string, number>;
  ave_height?: number;
  ave_weight?: number;
  adulthood_lifespan?: number[];
  is_starter?: boolean;
  image_id?: string | null;
  image_url?: string | null;
}

export interface CodexTrait extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  species?: string[];
  uses_per_rec?: number;
  rec_period?: string;
  flaw?: boolean;
  characteristic?: boolean;
  option_trait_ids?: string[];
}

export interface CodexEquipmentItem extends CodexRowVersion {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'equipment';
  subtype?: string;
  category?: string;
  description: string;
  damage?: string;
  armor_value?: number;
  gold_cost: number;
  currency: number;
  properties: string[];
  rarity?: string;
  weight?: number;
  image_id?: string | null;
  image_url?: string | null;
}

export interface CodexCreatureFeat extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  points: number;
  feat_points?: number;
  feat_lvl?: number;
  lvl_req?: number;
  mechanic?: boolean;
  tiers?: number;
  prereqs?: string[];
}

/** Archetype row as returned by `/api/codex` (includes flat level1 columns). */
export interface CodexArchetype extends Archetype, CodexRowVersion {
  level1_feats?: string[];
  level1_skills?: string[];
  level1_powers?: string[];
  /** Recommended Innate Powers (CSV column `level1_innate_powers`; TASK-473). */
  level1_innate_powers?: string[];
  level1_techniques?: string[];
  level1_armaments?: string[];
  level1_equipment?: string[];
  level1_remove_feats?: string[];
  level1_remove_powers?: string[];
  level1_remove_techniques?: string[];
  level1_remove_armaments?: string[];
  level1_notes?: string;
  level1_guidance_groups?: PathGuidanceGroup[] | null;
}

// =============================================================================
// Full codex response
// =============================================================================

/** Keys returned by GET `/api/codex`. */
export const CODEX_PAYLOAD_KEYS = [
  'feats',
  'skills',
  'species',
  'traits',
  'powerParts',
  'techniqueParts',
  'parts',
  'itemProperties',
  'equipment',
  'archetypes',
  'creatureFeats',
  'coreRules',
] as const;

export type CodexPayloadKey = (typeof CODEX_PAYLOAD_KEYS)[number];

/** Collection keys that are lists — `coreRules` is a record, not an array. */
export type CodexCollectionKey = Exclude<CodexPayloadKey, 'coreRules'>;

/** Validates `?collection=` on GET /api/codex. */
export function isCodexPayloadKey(value: string): value is CodexPayloadKey {
  return (CODEX_PAYLOAD_KEYS as readonly string[]).includes(value);
}

/** Canonical typed payload for `/api/codex`. */
export interface CodexPayload {
  feats: CodexFeat[];
  skills: CodexSkill[];
  species: CodexSpecies[];
  traits: CodexTrait[];
  powerParts: CodexPowerPart[];
  techniqueParts: CodexTechniquePart[];
  parts: CodexPart[];
  itemProperties: CodexItemProperty[];
  equipment: CodexEquipmentItem[];
  archetypes: CodexArchetype[];
  creatureFeats: CodexCreatureFeat[];
  /** Raw core_rules.data keyed by category id — merged into CoreRulesMap by useGameRules. */
  coreRules: Record<string, unknown>;
}

/** Backward-compatible aliases used across hooks and components. */
export type PowerPart = CodexPowerPart;
export type TechniquePart = CodexTechniquePart;
export type Part = CodexPart;
export type ItemProperty = CodexItemProperty;
export type Feat = CodexFeat;
export type Skill = CodexSkill;
export type Species = CodexSpecies;
export type Trait = CodexTrait;
export type EquipmentItem = CodexEquipmentItem;
export type CreatureFeat = CodexCreatureFeat;
