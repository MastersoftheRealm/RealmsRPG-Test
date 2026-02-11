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

/** Character visibility for sharing */
export type CharacterVisibility = 'private' | 'campaign' | 'public';

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
  // Named notes (custom notes with titles)
  namedNotes?: Array<{
    id: string;
    name: string;
    content: string;
  }>;
  
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
  
  // Ancestry (lean: { id, name, selectedTraits, selectedFlaw, selectedCharacteristic })
  ancestry?: CharacterAncestry;
  /** @deprecated Use ancestry.name instead. Kept for backward compat with old saves. */
  species?: string;
  
  // Skills
  skills?: CharacterSkills;
  /** Canonical defense allocation field — vals represent 2 skill points spent per 1 */
  defenseVals?: DefenseSkills;
  /** @deprecated Use defenseVals instead. Kept for backward compat with old saved data. */
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
  /** @deprecated Use currentHealth instead. ResourcePool kept for backward compat with old saves. */
  health?: ResourcePool;
  /** @deprecated Use currentEnergy instead. ResourcePool kept for backward compat with old saves. */
  energy?: ResourcePool;
  healthPoints?: number; // Points allocated to health
  energyPoints?: number; // Points allocated to energy
  /** Current health (runtime state). Canonical field — replaces health.current */
  currentHealth?: number;
  /** Current energy (runtime state). Canonical field — replaces energy.current */
  currentEnergy?: number;
  
  // Combat stats — speedBase/evasionBase are user inputs; speed/evasion/armor are derived
  /** @deprecated Derived from calculateAllStats(). Use calculatedStats.speed instead. */
  speed?: number;
  /** Base speed (default 6). Modifiable by feats/traits. */
  speedBase?: number;
  /** @deprecated Derived from calculateAllStats(). Use calculatedStats.evasion instead. */
  evasion?: number;
  /** Base evasion (default 10). Modifiable by feats/traits. */
  evasionBase?: number;
  /** @deprecated Derived from calculateAllStats(). Use calculatedStats.armor instead. */
  armor?: number;
  
  // Conditions
  conditions?: CharacterCondition[];
  
  // Proficiency — mart_prof/pow_prof are canonical
  /** @deprecated Use mart_prof instead. */
  martialProficiency?: number;
  /** @deprecated Use pow_prof instead. */
  powerProficiency?: number;
  /** Martial proficiency (user choice, set from archetype type) */
  mart_prof?: number;
  /** Power proficiency (user choice, set from archetype type) */
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

  /** Who can view this character: private (owner only), campaign (owner + campaign members), public */
  visibility?: CharacterVisibility;
  
  // Legacy fields for backward compatibility (vanilla site format)
  /** @deprecated Display-only computed field. Not saved. */
  allTraits?: unknown[];
  /** @deprecated Display-only computed field. Not saved. */
  _displayFeats?: unknown[];
  /** @deprecated Use ancestry.selectedTraits instead. */
  ancestryTraits?: string[];
  /** @deprecated Use ancestry.selectedFlaw instead. */
  flawTrait?: string | null;
  /** @deprecated Use ancestry.selectedCharacteristic instead. */
  characteristicTrait?: string | null;
  /** @deprecated Derived from codex by species ID. Not saved. */
  speciesTraits?: string[];
  /** @deprecated Removed from save. Use healthPoints/energyPoints instead. */
  health_energy_points?: { health: number; energy: number };
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

// =============================================================================
// LEAN CHARACTER SAVE DATA (TIER 6+ target schema)
// =============================================================================
// This is the design target for what gets persisted in the character JSONB column.
// Only user choices and runtime state — all display/computed values are derived
// from the codex/database at load time via enrichment.
// Implementation: TASK-203 through TASK-210 will migrate to this schema.

/** Lean character data — only what must be persisted */
export interface CharacterSaveData {
  // Identity
  name: string;
  status: CharacterStatus;
  portrait?: string; // Eventually move to Supabase Storage (TASK-219)
  visibility?: CharacterVisibility;

  // Core
  level: number;
  experience?: number;
  speciesId: string; // Reference to codex species by ID
  archetypeId: string; // Reference to codex archetype by ID (e.g., 'power', 'martial', 'powered-martial')
  abilities: Abilities;

  // Archetype abilities (player choice of which abilities power their archetype)
  pow_abil?: AbilityName;
  mart_abil?: AbilityName;

  // Species selections (from character creation)
  selectedTraits: string[]; // Trait IDs chosen from species ancestry_traits
  selectedFlaw: string; // Trait ID chosen from species flaws
  selectedCharacteristic: string; // Trait ID chosen from species characteristics

  // Health/Energy allocation (user-set points, not computed max)
  healthPoints: number;
  energyPoints: number;
  currentHealth: number; // Runtime state — always saved
  currentEnergy: number; // Runtime state — always saved

  // Proficiency
  mart_prof: number;
  pow_prof: number;
  archetypeChoices?: Record<number, 'innate' | 'feat'>; // P-M milestone choices

  // Skills — minimal: just ID → { prof, val } 
  skills: Record<string, { prof: boolean; val: number; selectedBaseSkillId?: string }>;
  defenseVals: DefenseSkills; // Vals represent 2 skill points spent per 1

  // Feats — just IDs + runtime uses
  archetypeFeats: Array<{ id: string; currentUses?: number }>;
  characterFeats: Array<{ id: string; currentUses?: number }>;

  // Powers/Techniques — just IDs + innate flag
  powers: Array<{ id: string; innate?: boolean }>;
  techniques: Array<{ id: string }>;

  // Equipment — just IDs + quantity + equipped flag
  inventory: Array<{ id: string; quantity: number; equipped?: boolean }>;
  currency: number;

  // Unarmed prowess
  unarmedProwess?: number;
  trainingPointsSpent?: number;

  // Conditions (runtime state)
  conditions?: Array<{ name: string; level: number; decaying: boolean }>;

  // Trait uses (runtime state)
  traitUses?: Record<string, number>;

  // User notes (free-form, always saved)
  description?: string;
  notes?: string;
  namedNotes?: Array<{ id: string; name: string; content: string }>;
  appearance?: string;
  archetypeDesc?: string;
  backstory?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}
