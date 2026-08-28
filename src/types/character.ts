/**
 * Character Types
 * ================
 * Main character data structure
 */

import type { AllowUndefinedOptionals } from '@/lib/utils/exact-optional';
import type { Abilities, AbilityName, DefenseName } from './abilities';
import type { CharacterArchetype } from './archetype';
import type { CharacterAncestry } from './ancestry';
import type { CharacterSkillRow, CharacterSkills, DefenseSkills } from './skills';
import type { CharacterFeat, FeatTraitCustomization } from './feats';
import type { CharacterEquipment } from './equipment';

/**
 * Persisted Temp Modifier deltas (ADR-0006 / TASK-585).
 * UI convenience — not a GAME_RULES term. Sparse integers; omit zeros on save.
 * Layers on top of base/computed values; does not rewrite allocation bases.
 */
interface CharacterTempModifiersFields {
  speed?: number | undefined;
  evasion?: number | undefined;
  damageReduction?: number | undefined;
  criticalRange?: number | undefined;
  terminal?: number | undefined;
  /** Ability Bonus/Penalty deltas (cascade per ADR-0006). */
  abilities?: Partial<Abilities> | undefined;
  /** Defense Bonus/Score layer deltas (by defense name). */
  defenses?: Partial<Record<DefenseName, number>> | undefined;
  /** Skill Bonus deltas keyed by skill id. */
  skills?: Record<string, number> | undefined;
  /**
   * When true, ability temps also adjust max Health / max Energy / TP maxima.
   * Default false (omit). Toggle lives in Abilities Temp Modifier UI (TASK-586).
   */
  applyAbilityToResourceMaxima?: boolean | undefined;
}

export type CharacterTempModifiers = AllowUndefinedOptionals<CharacterTempModifiersFields>;

export type ProficiencyKind = 'power_part' | 'technique_part' | 'item_property' | 'custom';

interface CharacterProficiencyFields {
  kind: ProficiencyKind;
  id: string;
  refId?: string | undefined;
  name: string;
  damageType?: string | undefined;
  op1Level?: number | undefined;
  op2Level?: number | undefined;
  op3Level?: number | undefined;
  baseTP?: number | undefined;
  op1TP?: number | undefined;
  op2TP?: number | undefined;
  op3TP?: number | undefined;
  custom?: boolean | undefined;
}

export type CharacterProficiency = AllowUndefinedOptionals<CharacterProficiencyFields>;

export type CharacterLibraryTabId =
  | 'powers'
  | 'techniques'
  | 'inventory'
  | 'feats'
  | 'proficiencies'
  | 'notes';

/** Character creation status */
export type CharacterStatus = 'draft' | 'complete' | 'playing';

/** Character visibility for sharing */
export type CharacterVisibility = 'private' | 'campaign' | 'public';

/** Entity type for calculations */
export type EntityType = 'PLAYER' | 'CREATURE';

/** Power entry on character */
interface CharacterPowerFields {
  id: number | string;
  name: string;
  level?: number | undefined;
  cost?: number | undefined;
  description?: string | undefined;
  innate?: boolean | undefined; // Whether this power is marked as innate
  // Display fields for character sheet (like vanilla site)
  actionType?: string | undefined; // e.g., "Basic Action", "Free Action", "Quick Action"
  damage?: string | undefined; // e.g., "2d6 fire"
  area?: string | undefined; // e.g., "Sphere 3", "Cone 5"
  duration?: string | undefined; // e.g., "Instant", "1 Minute", "Concentration"
  range?: string | number | undefined; // e.g., "30 spaces", "Melee", or numeric (spaces)
  /** Bank art (persisted when added from library). */
  image_id?: string | null | undefined;
  image_url?: string | null | undefined;
  // Parts can be either just names (string[]) or full part data with TP info
  parts?:
    | Array<
        | string
        | {
            id?: string | undefined;
            name?: string | undefined;
            base_tp?: number | undefined;
            op_1_lvl?: number | undefined;
            op_1_tp?: number | undefined;
            op_2_lvl?: number | undefined;
            op_2_tp?: number | undefined;
            op_3_lvl?: number | undefined;
            op_3_tp?: number | undefined;
          }
      >
    | undefined;
}

export type CharacterPower = AllowUndefinedOptionals<CharacterPowerFields>;

/** Technique entry on character */
interface CharacterTechniqueFields {
  id: number | string;
  name: string;
  cost?: number | undefined;
  description?: string | undefined;
  /** Derived Attack label ("No Attack" | "Unarmed" | "Weapon") from parts/attackMode. */
  weaponName?: string | undefined;
  actionType?: string | undefined; // e.g., "Basic Action", "Free Action"
  // Display fields for character sheet (like vanilla site)
  damage?: string | undefined; // e.g., "Weapon + 1d6"
  range?: string | undefined; // e.g., "Melee", "10 spaces"
  /** Bank art (persisted when added from library). */
  image_id?: string | null | undefined;
  image_url?: string | null | undefined;
  // Parts can be either just names (string[]) or full part data with TP info
  parts?:
    | Array<
        | string
        | {
            id?: string | undefined;
            name?: string | undefined;
            base_tp?: number | undefined;
            op_1_lvl?: number | undefined;
            op_1_tp?: number | undefined;
            op_2_lvl?: number | undefined;
            op_2_tp?: number | undefined;
            op_3_lvl?: number | undefined;
            op_3_tp?: number | undefined;
          }
      >
    | undefined;
}

export type CharacterTechnique = AllowUndefinedOptionals<CharacterTechniqueFields>;

/** Health/Energy tracking */
export interface ResourcePool {
  current: number;
  max: number;
  temporary?: number | undefined;
}

/** Condition effect on character */
export interface CharacterCondition {
  name: string;
  level: number; // For stacking/decaying conditions (e.g., Bleeding 3)
  decaying: boolean; // Does this condition decay by 1 each turn?
  description?: string | undefined;
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
interface CharacterFields {
  // Identity
  id: string;
  name: string;
  userId?: string | undefined;
  status?: CharacterStatus | undefined;
  portrait?: string | undefined;

  // Basic info
  level: number;
  experience?: number | undefined;
  description?: string | undefined;
  notes?: string | undefined;
  // Named notes (custom notes with titles)
  namedNotes?:
    | Array<{
        id: string;
        name: string;
        content: string;
      }>
    | undefined;

  // Physical attributes
  weight?: number | undefined;
  height?: number | undefined;
  age?: string | undefined;
  appearance?: string | undefined;
  archetypeDesc?: string | undefined;
  backstory?: string | undefined;

  // Core stats
  abilities: Abilities;

  // Archetype
  archetype?: CharacterArchetype | undefined;
  /** @deprecated Not persisted. Path characters are identified by `archetypePathId` only. */
  creationMode?: 'forge' | 'path' | undefined;
  /** When set, level-up and sheet may surface this path's recommendations. */
  archetypePathId?: string | undefined;
  pow_abil?: AbilityName | undefined;
  mart_abil?: AbilityName | undefined;

  // Ancestry (lean: { id, name, selectedTraits, selectedFlaw, selectedCharacteristic })
  ancestry?: CharacterAncestry | undefined;
  /** @deprecated Use ancestry.name instead. Kept for backward compat with old saves. */
  species?: string | undefined;

  // Skills — Record (legacy) or lean array rows (sheet / modern saves)
  skills?: CharacterSkills | CharacterSkillRow[] | undefined;
  /** Canonical defense allocation field — vals represent 2 skill points spent per 1 */
  defenseVals?: DefenseSkills | undefined;
  /** @deprecated Use defenseVals instead. Kept for backward compat with old saved data. */
  defenseSkills?: DefenseSkills | undefined;

  // Feats
  feats?: CharacterFeat[] | undefined;
  archetypeFeats?: CharacterFeat[] | undefined;

  // Powers and Techniques
  powers?: CharacterPower[] | undefined;
  techniques?: CharacterTechnique[] | undefined;
  innateEnergy?: number | undefined;

  // Equipment
  equipment?: CharacterEquipment | undefined;
  currency?: number | undefined;

  // Resources
  /** @deprecated Use currentHealth instead. ResourcePool kept for backward compat with old saves. */
  health?: ResourcePool | undefined;
  /** @deprecated Use currentEnergy instead. ResourcePool kept for backward compat with old saves. */
  energy?: ResourcePool | undefined;
  healthPoints?: number | undefined; // Points allocated to health
  energyPoints?: number | undefined; // Points allocated to energy
  /** Current health (runtime state). Canonical field — replaces health.current */
  currentHealth?: number | undefined;
  /** Current energy (runtime state). Canonical field — replaces energy.current */
  currentEnergy?: number | undefined;
  /** Action points (per round, default 4). Synced with encounter when character is in combat. */
  actionPoints?: number | undefined;

  // Combat stats — speedBase/evasionBase are user inputs; speed/evasion/armor are derived
  /** @deprecated Derived from calculateAllStats(). Use calculatedStats.speed instead. */
  speed?: number | undefined;
  /** Base speed (default 6). Modifiable by feats/traits. */
  speedBase?: number | undefined;
  /** @deprecated Derived from calculateAllStats(). Use calculatedStats.evasion instead. */
  evasion?: number | undefined;
  /** Base evasion (default 10). Modifiable by feats/traits. */
  evasionBase?: number | undefined;
  /** @deprecated Derived from calculateAllStats(). Use calculatedStats.armor instead. */
  armor?: number | undefined;

  // Conditions
  conditions?: CharacterCondition[] | undefined;

  // Proficiency — mart_prof/pow_prof are canonical
  /** @deprecated Use mart_prof instead. */
  martialProficiency?: number | undefined;
  /** @deprecated Use pow_prof instead. */
  powerProficiency?: number | undefined;
  /** Martial proficiency (user choice, set from archetype type) */
  mart_prof?: number | undefined;
  /** Power proficiency (user choice, set from archetype type) */
  pow_prof?: number | undefined;

  // Unarmed Prowess - fighting style for unarmed combat
  // Level 0 = not selected, 1 = base (10 TP), 2-5 = upgrades at levels 4,8,12,16,20 (6 TP each)
  unarmedProwess?: number | undefined;

  // Mixed archetype milestone choices (level -> 'innate' | 'feat')
  archetypeChoices?: Record<number, 'innate' | 'feat'> | undefined;

  // Trait uses tracking (trait name -> currentUses)
  traitUses?: Record<string, number> | undefined;

  /** Player custom names/notes for species/ancestry traits (keyed by trait id). */
  traitCustomizations?: Record<string, FeatTraitCustomization> | undefined;

  /** State uses remaining this recovery (max = archetype proficiency; restored on full recovery) */
  stateUsesCurrent?: number | undefined;

  // Training points tracking
  trainingPointsSpent?: number | undefined;
  proficiencies?: CharacterProficiency[] | undefined;

  // Metadata
  createdAt?: Date | string | undefined;
  updatedAt?: Date | string | undefined;
  lastPlayedAt?: Date | string | undefined;

  /** Who can view this character: private (owner only), campaign (owner + campaign members), public */
  visibility?: CharacterVisibility | undefined;

  /** How to display speed: spaces (default), feet (1 space = 5 ft), or meters (1 space = 1.5 m). Edit is always in spaces. */
  speedDisplayUnit?: 'spaces' | 'feet' | 'meters' | undefined;

  /** Character-sheet library tab visibility preferences (applied outside edit mode). */
  libraryTabVisibility?: Partial<Record<CharacterLibraryTabId, boolean>> | undefined;

  /**
   * Temp Modifier deltas (ADR-0006). Persist across refresh and campaign view.
   * Apply via `lib/character/temp-modifiers.ts` — do not invent parallel overlays.
   */
  tempModifiers?: CharacterTempModifiers | undefined;

  // Legacy fields for backward compatibility (vanilla site format)
  /** @deprecated Display-only computed field. Not saved. */
  allTraits?: unknown[] | undefined;
  /** @deprecated Display-only computed field. Not saved. */
  _displayFeats?: unknown[] | undefined;
  /** @deprecated Use ancestry.selectedTraits instead. */
  ancestryTraits?: string[] | undefined;
  /** @deprecated Use ancestry.selectedFlaw instead. */
  flawTrait?: string | null | undefined;
  /** @deprecated Use ancestry.selectedCharacteristic instead. */
  characteristicTrait?: string | null | undefined;
  /** @deprecated Derived from codex by species ID. Not saved. */
  speciesTraits?: string[] | undefined;
  /** @deprecated Removed from save. Use healthPoints/energyPoints instead. */
  health_energy_points?: { health: number; energy: number } | undefined;
}

export type Character = AllowUndefinedOptionals<CharacterFields>;

/** Character summary for list views */
interface CharacterSummaryFields {
  id: string;
  name: string;
  level: number;
  portrait?: string | undefined;
  archetypeName?: string | undefined;
  ancestryName?: string | undefined;
  status?: CharacterStatus | undefined;
  visibility?: CharacterVisibility | undefined;
  updatedAt?: Date | string | undefined;
}

export type CharacterSummary = AllowUndefinedOptionals<CharacterSummaryFields>;

/** Character creation draft */
interface CharacterDraftFields extends Partial<Omit<Character, 'skills'>> {
  /** Creator uses Record<skillId, ranks>; sheet may persist lean array rows on Character. */
  skills?: CharacterSkills | undefined;
  step?: number | undefined;
  isComplete?: boolean | undefined;
  /** For multi-ability skills (e.g. Craft): skillId -> chosen ability key */
  skillAbilities?: Record<string, string> | undefined;
  /**
   * Path creation only: recommended skill IDs the player removed after the default fill.
   * Prevents re-adding them on every render while still on the Skills step.
   */
  declinedPathSkillIds?: string[] | undefined;
  /**
   * Idempotency key for POST create. Persisted with the draft so a reload-then-retry
   * still hits the same row. Not saved on the character document.
   */
  clientRequestId?: string | null | undefined;
}

export type CharacterDraft = AllowUndefinedOptionals<CharacterDraftFields>;

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
  portrait?: string | undefined; // Eventually move to Supabase Storage (TASK-219)
  visibility?: CharacterVisibility | undefined;

  // Core
  level: number;
  experience?: number | undefined;
  speciesId: string; // Reference to codex species by ID
  archetypeId: string; // Reference to codex archetype by ID (e.g., 'power', 'martial', 'powered-martial')
  abilities: Abilities;

  // Archetype abilities (player choice of which abilities power their archetype)
  pow_abil?: AbilityName | undefined;
  mart_abil?: AbilityName | undefined;

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
  archetypeChoices?: Record<number, 'innate' | 'feat'> | undefined; // P-M milestone choices

  // Skills — minimal: just ID → { prof, val }
  skills: Record<string, { prof: boolean; val: number; selectedBaseSkillId?: string | undefined }>;
  defenseVals: DefenseSkills; // Vals represent 2 skill points spent per 1

  // Feats — IDs + runtime uses + optional player customName/note
  archetypeFeats: Array<{
    id: string;
    currentUses?: number | undefined;
    customName?: string | undefined;
    note?: string | undefined;
  }>;
  characterFeats: Array<{
    id: string;
    currentUses?: number | undefined;
    customName?: string | undefined;
    note?: string | undefined;
  }>;

  /** Player custom names/notes for traits (keyed by trait id). */
  traitCustomizations?: Record<string, FeatTraitCustomization> | undefined;

  // Powers/Techniques — just IDs + innate flag
  powers: Array<{ id: string; innate?: boolean | undefined }>;
  techniques: Array<{ id: string }>;

  // Equipment — just IDs + quantity + equipped flag
  inventory: Array<{ id: string; quantity: number; equipped?: boolean | undefined }>;
  currency: number;

  // Unarmed prowess
  unarmedProwess?: number | undefined;
  trainingPointsSpent?: number | undefined;
  proficiencies?: CharacterProficiency[] | undefined;

  // Conditions (runtime state)
  conditions?: Array<{ name: string; level: number; decaying: boolean }> | undefined;

  // Trait uses (runtime state)
  traitUses?: Record<string, number> | undefined;

  /** Temp Modifier deltas (ADR-0006) — runtime convenience, always saved when present */
  tempModifiers?: CharacterTempModifiers | undefined;

  // User notes (free-form, always saved)
  description?: string | undefined;
  notes?: string | undefined;
  namedNotes?: Array<{ id: string; name: string; content: string }> | undefined;
  age?: string | undefined;
  appearance?: string | undefined;
  archetypeDesc?: string | undefined;
  backstory?: string | undefined;

  // Timestamps
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}
