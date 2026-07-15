/**
 * Archetype Types
 * ================
 * Character archetype definitions
 */

import type { AbilityName } from './abilities';

/** The three main archetype categories */
export type ArchetypeCategory = 'power' | 'powered-martial' | 'martial';

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

/** Build-goal group with one-line "why" copy for Layer 1 guided steps. */
export interface PathGuidanceGroup {
  id: string;
  title: string;
  why?: string;
  feats?: string[];
  powers?: string[];
  techniques?: string[];
  armaments?: string[];
  equipment?: string[];
}

/**
 * Legacy kit shape previously stored in `level1_loadouts` (guided quick kits, removed TASK-442).
 * Still parsed for backward-compat / path-validation if stale JSON appears; not authored in admin.
 */
export interface PathLoadout {
  id: string;
  title: string;
  why?: string;
  armaments?: PathItemRecommendation[];
  armor?: PathItemRecommendation[];
  equipment?: PathItemRecommendation[];
}

export interface ArchetypePathRecommendations {
  feats?: string[];
  skills?: string[];
  powers?: string[];
  techniques?: string[];
  armaments?: string[];
  equipment?: string[];
  /** Layer 1 grouped recommendations with why-copy (feats, powers, equipment steps). */
  guidance_groups?: PathGuidanceGroup[];
  /**
   * Recommended ability array for the guided creator's Abilities chapter (one-click apply).
   * Map of ability name -> value (e.g. { strength: 3, vitality: 2, ... }).
   */
  recommended_abilities?: Partial<Record<AbilityName, number>>;
  /** @deprecated Quick kits removed (TASK-442). Parsed only for legacy JSON / publish validation. */
  loadouts?: PathLoadout[];
  /** Optional species IDs/names recommended for this path (species step Layer 1). */
  recommended_species?: string[];
  /** Parsed armaments with quantity (id or "id:qty" from armaments array) */
  armamentRecommendations?: PathItemRecommendation[];
  /** Parsed equipment with quantity */
  equipmentRecommendations?: PathItemRecommendation[];
  /** When true, path recommends Unarmed Prowess proficiency (equipment step simplified view) */
  recommendUnarmedProwess?: boolean;
  /** Guided equipment phase 2: skip armor, optional unarmored, or required. */
  armorStep?: 'required' | 'optional' | 'none';
  /** Recommended adventuring gear for the path (guided gear phase L1 + Add all). */
  sharedEquipment?: PathItemRecommendation[];
  removeFeats?: string[];
  removePowers?: string[];
  removeTechniques?: string[];
  removeArmaments?: string[];
  notes?: string;
}

export interface ArchetypePathLevel extends ArchetypePathRecommendations {
  level: number;
}

export interface ArchetypePathData {
  level1?: ArchetypePathRecommendations & {
    proficiency?: {
      power?: number;
      martial?: number;
    };
  };
  levels?: ArchetypePathLevel[];
}

/** Full archetype definition from database */
export interface Archetype {
  id: string;
  name: string;
  type: ArchetypeCategory;
  description?: string;
  archetype_ability?: AbilityName;
  secondary_ability?: AbilityName;
  power_prof_start?: number;
  martial_prof_start?: number;
  power_prof_level5?: number;
  martial_prof_level5?: number;
  /** Parsed path recommendations; legacy rows may remain a loose JSON object until migrated. */
  path_data?: ArchetypePathData | Record<string, unknown>;
  pow_abil?: AbilityName;
  mart_abil?: AbilityName;
  ability?: AbilityName; // Legacy field
  /** @deprecated Not loaded from codex_archetypes; path picks use path_data level rows instead. */
  feats?: ArchetypeFeat[];
  /** @deprecated Not loaded from codex_archetypes; unused in player UX. */
  traits?: ArchetypeTrait[];
}

/** Archetype feat from database */
export interface ArchetypeFeat {
  id: number | string;
  name: string;
  description?: string;
  level?: number;
}

/** Archetype trait from database */
export interface ArchetypeTrait {
  id: number | string;
  name: string;
  description?: string;
}

/** Character's selected archetype data (lean: { id, type } saved, rest derived from codex) */
export interface CharacterArchetype {
  id: string;
  /** @deprecated Derived from codex on load. Kept for backward compat with old saves. */
  name?: string;
  type: ArchetypeCategory;
  /** @deprecated Derived from codex on load. */
  description?: string;
  /** @deprecated Use Character.pow_abil instead. */
  pow_abil?: AbilityName;
  /** @deprecated Use Character.mart_abil instead. */
  mart_abil?: AbilityName;
  /** @deprecated Use Character.pow_abil instead. */
  ability?: AbilityName;
  archetype_ability?: AbilityName;
  secondary_ability?: AbilityName;
  power_prof_start?: number;
  martial_prof_start?: number;
  power_prof_level5?: number;
  martial_prof_level5?: number;
  path_data?: ArchetypePathData;
  selectedFeats?: string[];
}
