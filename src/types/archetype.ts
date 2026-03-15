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

export interface ArchetypePathRecommendations {
  feats?: string[];
  skills?: string[];
  powers?: string[];
  techniques?: string[];
  armaments?: string[];
  equipment?: string[];
  /** Parsed armaments with quantity (id or "id:qty" from armaments array) */
  armamentRecommendations?: PathItemRecommendation[];
  /** Parsed equipment with quantity */
  equipmentRecommendations?: PathItemRecommendation[];
  /** When true, path recommends Unarmed Prowess proficiency (equipment step simplified view) */
  recommendUnarmedProwess?: boolean;
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
  path_data?: ArchetypePathData;
  pow_abil?: AbilityName;
  mart_abil?: AbilityName;
  ability?: AbilityName; // Legacy field
  feats?: ArchetypeFeat[];
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
