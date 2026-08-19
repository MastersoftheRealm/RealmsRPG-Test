/**
 * Codex API Types
 * ===============
 * Canonical typed payload for `/api/codex` (HYG-01 / TASK-378).
 * Collection entity shapes match `src/lib/codex/row-map.ts` (GET `/api/codex` + view enrichment).
 * Archetype path join stays in the route.
 */

import type { AllowUndefinedOptionals } from '@/lib/utils/exact-optional';
import type { Archetype, PathGuidanceGroup } from './archetype';

// =============================================================================
// Entity types (codex collections)
// =============================================================================

/**
 * Row version carried through `/api/codex` so admin saves can send the value they loaded
 * and be rejected when another admin has written since. Absent until the table has the column.
 */
interface CodexRowVersionFields {
  updated_at?: string | undefined;
}

export type CodexRowVersion = AllowUndefinedOptionals<CodexRowVersionFields>;

interface CodexPowerPartFields extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  category: string;
  base_en: number;
  base_tp: number;
  op_1_desc?: string | undefined;
  op_1_en?: number | undefined;
  op_1_tp?: number | undefined;
  op_2_desc?: string | undefined;
  op_2_en?: number | undefined;
  op_2_tp?: number | undefined;
  op_3_desc?: string | undefined;
  op_3_en?: number | undefined;
  op_3_tp?: number | undefined;
  duration?: boolean | undefined;
  percentage?: boolean | undefined;
  mechanic?: boolean | undefined;
  /** Targeted defenses (subset of the 6 canonical defenses). */
  defense?: string[] | undefined;
  type?: string | undefined;
}

export type CodexPowerPart = AllowUndefinedOptionals<CodexPowerPartFields>;

interface CodexTechniquePartFields extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  category: string;
  base_tp: number;
  base_en?: number | undefined;
  op_1_desc?: string | undefined;
  op_1_en?: number | undefined;
  op_1_tp?: number | undefined;
  op_2_desc?: string | undefined;
  op_2_en?: number | undefined;
  op_2_tp?: number | undefined;
  op_3_desc?: string | undefined;
  op_3_en?: number | undefined;
  op_3_tp?: number | undefined;
  percentage?: boolean | undefined;
  mechanic?: boolean | undefined;
  type?: string | undefined;
}

export type CodexTechniquePart = AllowUndefinedOptionals<CodexTechniquePartFields>;

export type CodexPart = CodexPowerPart & { type: 'power' | 'technique' | string };

interface CodexItemPropertyFields extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  type?: 'weapon' | 'armor' | 'shield' | 'general' | undefined;
  tp_cost?: number | undefined;
  gold_cost?: number | undefined;
  base_ip?: number | undefined;
  base_tp?: number | undefined;
  base_c?: number | undefined;
  op_1_desc?: string | undefined;
  op_1_ip?: number | undefined;
  op_1_tp?: number | undefined;
  op_1_c?: number | undefined;
  mechanic?: boolean | undefined;
}

export type CodexItemProperty = AllowUndefinedOptionals<CodexItemPropertyFields>;

interface CodexFeatFields extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  category: string;
  ability?: string[] | undefined;
  ability_req: string[];
  abil_req_val: number[];
  tags: string[];
  skill_req: string[];
  skill_req_val: number[];
  lvl_req: number;
  uses_per_rec: number;
  mart_abil_req?: number | string | undefined;
  char_feat: boolean;
  state_feat: boolean;
  rec_period?: string | undefined;
  feat_lvl?: number | undefined;
  base_feat_id?: string | undefined;
  req_desc?: string | undefined;
  feat_cat_req?: string | undefined;
  pow_abil_req?: number | undefined;
  pow_prof_req?: number | undefined;
  mart_prof_req?: number | undefined;
  speed_req?: number | undefined;
}

export type CodexFeat = AllowUndefinedOptionals<CodexFeatFields>;

interface CodexSkillFields extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  ability: string;
  base_skill_id?: number | undefined;
  success_desc?: string | undefined;
  failure_desc?: string | undefined;
  ds_calc?: string | undefined;
  craft_success_desc?: string | undefined;
  craft_failure_desc?: string | undefined;
}

export type CodexSkill = AllowUndefinedOptionals<CodexSkillFields>;

interface CodexSpeciesFields extends CodexRowVersion {
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
  ability_bonuses?: Record<string, number> | undefined;
  ave_height?: number | undefined;
  ave_weight?: number | undefined;
  adulthood_lifespan?: number[] | undefined;
  is_starter?: boolean | undefined;
  image_id?: string | null | undefined;
  image_url?: string | null | undefined;
}

export type CodexSpecies = AllowUndefinedOptionals<CodexSpeciesFields>;

interface CodexTraitFields extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  species?: string[] | undefined;
  uses_per_rec?: number | undefined;
  rec_period?: string | undefined;
  flaw?: boolean | undefined;
  characteristic?: boolean | undefined;
  option_trait_ids?: string[] | undefined;
}

export type CodexTrait = AllowUndefinedOptionals<CodexTraitFields>;

interface CodexEquipmentItemFields extends CodexRowVersion {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'equipment';
  subtype?: string | undefined;
  category?: string | undefined;
  description: string;
  damage?: string | undefined;
  armor_value?: number | undefined;
  gold_cost: number;
  currency: number;
  properties: string[];
  rarity?: string | undefined;
  weight?: number | undefined;
  image_id?: string | null | undefined;
  image_url?: string | null | undefined;
}

export type CodexEquipmentItem = AllowUndefinedOptionals<CodexEquipmentItemFields>;

interface CodexCreatureFeatFields extends CodexRowVersion {
  id: string;
  name: string;
  description: string;
  points: number;
  feat_points?: number | undefined;
  feat_lvl?: number | undefined;
  lvl_req?: number | undefined;
  mechanic?: boolean | undefined;
  tiers?: number | undefined;
  prereqs?: string[] | undefined;
}

export type CodexCreatureFeat = AllowUndefinedOptionals<CodexCreatureFeatFields>;

/** Archetype row as returned by `/api/codex` (includes flat level1 columns). */
interface CodexArchetypeFields extends Archetype, CodexRowVersion {
  level1_feats?: string[] | undefined;
  level1_skills?: string[] | undefined;
  level1_powers?: string[] | undefined;
  /** Recommended Innate Powers (CSV column `level1_innate_powers`; TASK-473). */
  level1_innate_powers?: string[] | undefined;
  level1_techniques?: string[] | undefined;
  level1_armaments?: string[] | undefined;
  level1_equipment?: string[] | undefined;
  level1_remove_feats?: string[] | undefined;
  level1_remove_powers?: string[] | undefined;
  level1_remove_techniques?: string[] | undefined;
  level1_remove_armaments?: string[] | undefined;
  level1_notes?: string | undefined;
  level1_guidance_groups?: PathGuidanceGroup[] | null | undefined;
}

export type CodexArchetype = AllowUndefinedOptionals<CodexArchetypeFields>;

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
