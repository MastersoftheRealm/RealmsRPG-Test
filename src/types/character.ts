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
  innate?: boolean; // Whether this power is marked as innate
  // Display fields for character sheet (like vanilla site)
  actionType?: string; // e.g., "Basic Action", "Free Action", "Quick Action"
  damage?: string; // e.g., "2d6 fire"
  area?: string; // e.g., "Sphere 3", "Cone 5"
  duration?: string; // e.g., "Instant", "1 Minute", "Concentration"
  range?: string | number; // e.g., "30 spaces", "Melee", or numeric (spaces)
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
  weaponName?: string; // Required weapon type (e.g., "Sword", "Unarmed")
  actionType?: string; // e.g., "Basic Action", "Free Action"
  // Display fields for character sheet (like vanilla site)
  damage?: string; // e.g., "Weapon + 1d6"
  range?: string; // e.g., "Melee", "10 spaces"
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
  species?: string; // Legacy field - species name (redundant with ancestry.name)
  
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
  // Legacy aliases (vanilla site uses these)
  mart_prof?: number;
  pow_prof?: number;
  
  // Unarmed Prowess - fighting style for unarmed combat
  // Level 0 = not selected, 1 = base (10 TP), 2-5 = upgrades at levels 4,8,12,16,20 (6 TP each)
  unarmedProwess?: number;
  
  // Mixed archetype milestone choices (level -> 'innate' | 'feat')
  archetypeChoices?: Record<number, 'innate' | 'feat'>;
  
  // Trait uses tracking (trait name -> currentUses)
  traitUses?: Record<string, number>;
  
  // Training points tracking
  trainingPointsSpent?: number;
  
  // Metadata
  createdAt?: Date | string;
  updatedAt?: Date | string;
  lastPlayedAt?: Date | string;
  
  // Legacy fields for compatibility (vanilla site format)
  allTraits?: unknown[];
  _displayFeats?: unknown[];
  // Vanilla site stores traits at top level instead of inside ancestry object
  ancestryTraits?: string[];
  flawTrait?: string | null;
  characteristicTrait?: string | null;
  speciesTraits?: string[];
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
