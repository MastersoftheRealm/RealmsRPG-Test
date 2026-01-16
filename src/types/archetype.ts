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

/** Archetype configuration values */
export interface ArchetypeConfig {
  featLimit: number;
  armamentMax: number;
  innateEnergy: number;
  proficiency: ArchetypeProficiency;
  trainingPointBonus: number;
}

/** Full archetype definition from database */
export interface Archetype {
  id: string;
  name: string;
  type: ArchetypeCategory;
  description?: string;
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

/** Character's selected archetype data */
export interface CharacterArchetype {
  id: string;
  name: string;
  type: ArchetypeCategory;
  description?: string;
  pow_abil?: AbilityName;
  mart_abil?: AbilityName;
  ability?: AbilityName;
  selectedFeats?: string[];
}
