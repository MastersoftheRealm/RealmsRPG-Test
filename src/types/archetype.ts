/**
 * Archetype Types
 * ================
 * Character archetype definitions
 */

import type { AllowUndefinedOptionals } from '@/lib/utils/exact-optional';
import type { AbilityName } from './abilities';

/** The three main archetype categories */
export type ArchetypeCategory = 'power' | 'powered-martial' | 'martial';

/** Archetype category inferred from martial + power proficiency split (TASK-663). */
export type ProficiencyDerivedArchetype = ArchetypeCategory | 'none';

/** Proficiency configuration for archetypes */
export interface ArchetypeProficiency {
  martial: number;
  power: number;
}

/** Archetype configuration values (level 1 starting values) */
export interface ArchetypeConfig {
  /** Bonus archetype feats at level 1 (Martial=2, Power=0, P-M=0) */
  featLimit: number;
  /** Max armament training points (from Martial Proficiency lookup table) */
  armamentMax: number;
  /** Starting innate energy (Threshold × Pools) */
  innateEnergy: number;
  /** Starting innate threshold (max EN cost for innate power) */
  innateThreshold: number;
  /** Starting innate pools (max number of innate powers at threshold) */
  innatePools: number;
  proficiency: ArchetypeProficiency;
  trainingPointBonus: number;
}

/** Recommended item with optional quantity (for path armaments/equipment) */
export interface PathItemRecommendation {
  id: string;
  quantity: number;
}

/**
 * Which guided creator step consumes a feat guidance group (TASK-514).
 * Explicit field — do not infer from title in new authoring.
 */
export type PathGuidanceAudience = 'character' | 'archetype';

/** Build-goal group with one-line "why" copy for Layer 1 guided steps. */
interface PathGuidanceGroupFields {
  id: string;
  title: string;
  why?: string | undefined;
  /**
   * Feat groups: character vs archetype step. Optional on legacy JSON; parsers backfill
   * from title heuristics when missing (TASK-514).
   */
  audience?: PathGuidanceAudience | undefined;
  feats?: string[] | undefined;
  powers?: string[] | undefined;
  /**
   * Recommended innate powers (Power / Powered-Martial). Distinct from `powers`.
   * Populated from path_data / level1_innate_powers when authored (TASK-473).
   */
  innatePowers?: string[] | undefined;
  techniques?: string[] | undefined;
  armaments?: string[] | undefined;
  equipment?: string[] | undefined;
}

export type PathGuidanceGroup = AllowUndefinedOptionals<PathGuidanceGroupFields>;

/**
 * Legacy kit shape previously stored in `level1_loadouts` (guided quick kits, removed TASK-442).
 * Still parsed for backward-compat / path-validation if stale JSON appears; not authored in admin.
 */
interface PathLoadoutFields {
  id: string;
  title: string;
  why?: string | undefined;
  armaments?: PathItemRecommendation[] | undefined;
  armor?: PathItemRecommendation[] | undefined;
  equipment?: PathItemRecommendation[] | undefined;
}

export type PathLoadout = AllowUndefinedOptionals<PathLoadoutFields>;

interface ArchetypePathRecommendationsFields {
  feats?: string[] | undefined;
  skills?: string[] | undefined;
  powers?: string[] | undefined;
  /**
   * Recommended Innate Powers (distinct from `powers`). From `level1_innate_powers` CSV
   * or path_data.level1.innatePowers. Empty until authored (TASK-473 / TASK-471).
   */
  innatePowers?: string[] | undefined;
  techniques?: string[] | undefined;
  armaments?: string[] | undefined;
  equipment?: string[] | undefined;
  /** Layer 1 grouped recommendations with why-copy (feats, powers, equipment steps). */
  guidance_groups?: PathGuidanceGroup[] | undefined;
  /**
   * Recommended ability array for the guided creator's Abilities chapter (one-click apply).
   * Map of ability name -> value (e.g. { strength: 3, vitality: 2, ... }).
   */
  recommended_abilities?: Partial<Record<AbilityName, number>> | undefined;
  /** @deprecated Quick kits removed (TASK-442). Parsed only for legacy JSON / publish validation. */
  loadouts?: PathLoadout[] | undefined;
  /** Parsed armaments with quantity (id or "id:qty" from armaments array) */
  armamentRecommendations?: PathItemRecommendation[] | undefined;
  /** Parsed equipment with quantity */
  equipmentRecommendations?: PathItemRecommendation[] | undefined;
  /** When true, path recommends Unarmed Prowess proficiency (equipment step simplified view) */
  recommendUnarmedProwess?: boolean | undefined;
  /** Guided equipment phase 2: skip armor, optional unarmored, or required. */
  armorStep?: 'required' | 'optional' | 'none' | undefined;
  /** Recommended Equipment for the path (guided Equipment phase L1 + Add all). */
  sharedEquipment?: PathItemRecommendation[] | undefined;
  removeFeats?: string[] | undefined;
  removePowers?: string[] | undefined;
  removeTechniques?: string[] | undefined;
  removeArmaments?: string[] | undefined;
  notes?: string | undefined;
}

export type ArchetypePathRecommendations =
  AllowUndefinedOptionals<ArchetypePathRecommendationsFields>;

export type ArchetypePathLevel = ArchetypePathRecommendations & { level: number };

interface ArchetypePathDataFields {
  level1?:
    | (ArchetypePathRecommendations & {
        proficiency?:
          | {
              power?: number | undefined;
              martial?: number | undefined;
            }
          | undefined;
      })
    | undefined;
  levels?: ArchetypePathLevel[] | undefined;
}

export type ArchetypePathData = AllowUndefinedOptionals<ArchetypePathDataFields>;

/** Full archetype definition from database */
interface ArchetypeFields {
  id: string;
  name: string;
  type: ArchetypeCategory;
  description?: string | undefined;
  archetype_ability?: AbilityName | undefined;
  secondary_ability?: AbilityName | undefined;
  power_prof_start?: number | undefined;
  martial_prof_start?: number | undefined;
  power_prof_level5?: number | undefined;
  martial_prof_level5?: number | undefined;
  /** Parsed path recommendations; legacy rows may remain a loose JSON object until migrated. */
  path_data?: ArchetypePathData | Record<string, unknown> | undefined;
  pow_abil?: AbilityName | undefined;
  mart_abil?: AbilityName | undefined;
  ability?: AbilityName | undefined; // Legacy field
  /** @deprecated Not loaded from codex_archetypes; path picks use path_data level rows instead. */
  feats?: ArchetypeFeat[] | undefined;
  /** @deprecated Not loaded from codex_archetypes; unused in player UX. */
  traits?: ArchetypeTrait[] | undefined;
}

export type Archetype = AllowUndefinedOptionals<ArchetypeFields>;

/** Archetype feat from database */
interface ArchetypeFeatFields {
  id: number | string;
  name: string;
  description?: string | undefined;
  level?: number | undefined;
}

export type ArchetypeFeat = AllowUndefinedOptionals<ArchetypeFeatFields>;

/** Archetype trait from database */
interface ArchetypeTraitFields {
  id: number | string;
  name: string;
  description?: string | undefined;
}

export type ArchetypeTrait = AllowUndefinedOptionals<ArchetypeTraitFields>;

/** Character's selected archetype data (lean: { id, type } saved, rest derived from codex) */
interface CharacterArchetypeFields {
  id: string;
  /** @deprecated Derived from codex on load. Kept for backward compat with old saves. */
  name?: string | undefined;
  type: ArchetypeCategory;
  /** @deprecated Derived from codex on load. */
  description?: string | undefined;
  /** @deprecated Use Character.pow_abil instead. */
  pow_abil?: AbilityName | undefined;
  /** @deprecated Use Character.mart_abil instead. */
  mart_abil?: AbilityName | undefined;
  /** @deprecated Use Character.pow_abil instead. */
  ability?: AbilityName | undefined;
  archetype_ability?: AbilityName | undefined;
  secondary_ability?: AbilityName | undefined;
  power_prof_start?: number | undefined;
  martial_prof_start?: number | undefined;
  power_prof_level5?: number | undefined;
  martial_prof_level5?: number | undefined;
  path_data?: ArchetypePathData | undefined;
  selectedFeats?: string[] | undefined;
}

export type CharacterArchetype = AllowUndefinedOptionals<CharacterArchetypeFields>;
