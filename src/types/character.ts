/**
 * Character Types
 * ================
 * Main character data structure
 */

import type { Abilities, AbilityName, DefenseBonuses } from './abilities';
import type { CharacterArchetype } from './archetype';
import type { CharacterAncestry } from './ancestry';
import type { CharacterSkills, DefenseSkills } from './skills';
import type { CharacterFeat } from './feats';
import type { CharacterEquipment, Item } from './equipment';

/** Character creation status */
export type CharacterStatus = 'draft' | 'complete' | 'playing';

/** Entity type for calculations */
export type EntityType = 'PLAYER' | 'CREATURE';

/** Power entry on character */
export interface CharacterPower {
  id: number | string;
  name: string;
  level?: number;
  cost?: number;
  description?: string;
  // Parts can be either just names (string[]) or full part data with TP info
  parts?: Array<string | {
    id?: string;
    name?: string;
    base_tp?: number;
    op_1_lvl?: number;
    op_1_tp?: number;
    op_2_lvl?: number;
    op_2_tp?: number;
    op_3_lvl?: number;
    op_3_tp?: number;
  }>;
}

/** Technique entry on character */
export interface CharacterTechnique {
  id: number | string;
  name: string;
  cost?: number;
  description?: string;
  // Parts can be either just names (string[]) or full part data with TP info
  parts?: Array<string | {
    id?: string;
    name?: string;
    base_tp?: number;
    op_1_lvl?: number;
    op_1_tp?: number;
    op_2_lvl?: number;
    op_2_tp?: number;
    op_3_lvl?: number;
    op_3_tp?: number;
  }>;
}

/** Health/Energy tracking */
export interface ResourcePool {
  current: number;
  max: number;
  temporary?: number;
}

/** Condition effect on character */
export interface CharacterCondition {
  name: string;
  level: number; // For stacking/decaying conditions (e.g., Bleeding 3)
  decaying: boolean; // Does this condition decay by 1 each turn?
  description?: string;
}

/** Combat bonuses */
export interface CombatBonuses {
  martial: number;
  power: number;
  strength: { prof: number; unprof: number };
  agility: { prof: number; unprof: number };
  acuity: { prof: number; unprof: number };
  intelligence: { prof: number; unprof: number };
}

/** Full character data structure */
export interface Character {
  // Identity
  id: string;
  name: string;
  userId?: string;
  status?: CharacterStatus;
  portrait?: string;
  
  // Basic info
  level: number;
  experience?: number;
  description?: string;
  notes?: string;
  
  // Physical attributes
  weight?: number;
  height?: number;
  appearance?: string;
  archetypeDesc?: string;
  
  // Core stats
  abilities: Abilities;
  
  // Archetype
  archetype?: CharacterArchetype;
  pow_abil?: AbilityName;
  mart_abil?: AbilityName;
  
  // Ancestry
  ancestry?: CharacterAncestry;
  
  // Skills
  skills?: CharacterSkills;
  defenseSkills?: DefenseSkills;
  
  // Feats
  feats?: CharacterFeat[];
  archetypeFeats?: CharacterFeat[];
  
  // Powers and Techniques
  powers?: CharacterPower[];
  techniques?: CharacterTechnique[];
  innateEnergy?: number;
  
  // Equipment
  equipment?: CharacterEquipment;
  currency?: number;
  
  // Resources
  health?: ResourcePool;
  energy?: ResourcePool;
  healthPoints?: number; // Points allocated to health
  energyPoints?: number; // Points allocated to energy
  
  // Combat stats
  speed?: number;
  speedBase?: number;
  evasion?: number;
  evasionBase?: number;
  armor?: number;
  
  // Conditions
  conditions?: CharacterCondition[];
  
  // Proficiency
  martialProficiency?: number;
  powerProficiency?: number;
  
  // Training points tracking
  trainingPointsSpent?: number;
  
  // Metadata
  createdAt?: Date | string;
  updatedAt?: Date | string;
  lastPlayedAt?: Date | string;
  
  // Legacy fields for compatibility
  allTraits?: unknown[];
  _displayFeats?: unknown[];
}

/** Character summary for list views */
export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  portrait?: string;
  archetypeName?: string;
  ancestryName?: string;
  status?: CharacterStatus;
  updatedAt?: Date | string;
}

/** Character creation draft */
export interface CharacterDraft extends Partial<Character> {
  step?: number;
  isComplete?: boolean;
}
