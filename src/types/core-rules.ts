/**
 * Core Rules Types
 * =================
 * TypeScript types for the core_rules table data.
 * Each category has a well-defined shape matching the seed data.
 */

// ─── Progression ──────────────────────────────────────────────────────────

export interface ProgressionPlayerRules {
  baseAbilityPoints: number;
  abilityPointsEveryNLevels: number;
  abilityPointsPerIncrease: number;
  skillPointsPerLevel: number;
  baseHitEnergyPool: number;
  hitEnergyPerLevel: number;
  baseProficiency: number;
  proficiencyEveryNLevels: number;
  proficiencyPerIncrease: number;
  baseTrainingPoints: number;
  tpPerLevelMultiplier: number;
  baseHealth: number;
  xpToLevelFormula: string;
  startingCurrency: number;
  characterFeatsPerLevel: number;
}

export interface ProgressionCreatureRules {
  baseAbilityPoints: number;
  abilityPointsEveryNLevels: number;
  skillPointsAtLevel1: number;
  skillPointsPerLevel: number;
  baseHitEnergyPool: number;
  hitEnergyPerLevel: number;
  baseProficiency: number;
  proficiencyEveryNLevels: number;
  baseTrainingPoints: number;
  tpPerLevelMultiplier: number;
  baseFeatPoints: number;
  featPointsPerLevel: number;
  baseCurrency: number;
  currencyGrowthRate: number;
}

// ─── Ability Rules ────────────────────────────────────────────────────────

export interface AbilityRules {
  min: number;
  maxStarting: number;
  maxAbsoluteCharacter: number;
  maxAbsoluteCreature: number;
  costIncreaseThreshold: number;
  normalCost: number;
  increasedCost: number;
  maxTotalNegative: number;
  standardArrays: Record<string, number[]>;
  abilities: string[];
  defenses: string[];
  abilityDefenseMap: Record<string, string>;
}

// ─── Archetypes ───────────────────────────────────────────────────────────

export interface ArchetypeConfigRules {
  featLimit: number;
  armamentMax: number;
  innateEnergy: number;
  innateThreshold: number;
  innatePools: number;
  proficiency: { martial: number; power: number };
  trainingPointBonus: number;
}

export interface ArchetypeProgressionEntry {
  level: number;
  [key: string]: number;
}

export interface ArchetypeRules {
  types: string[];
  configs: Record<string, ArchetypeConfigRules>;
  martialBonusFeatsBase: number;
  martialBonusFeatsInterval: number;
  martialBonusFeatsStartLevel: number;
  poweredMartialMilestoneInterval: number;
  poweredMartialMilestoneStartLevel: number;
  proficiencyIncreaseInterval: number;
  powerProgression: ArchetypeProgressionEntry[];
  martialProgression: ArchetypeProgressionEntry[];
}

// ─── Armament Proficiency ─────────────────────────────────────────────────

export interface ArmamentProficiencyRules {
  table: Array<{ martialProf: number; armamentMax: number }>;
}

// ─── Combat ───────────────────────────────────────────────────────────────

export interface CombatRules {
  baseSpeed: number;
  baseEvasion: number;
  baseDefense: number;
  apPerRound: number;
  actionCosts: Record<string, number>;
  multipleActionPenalty: number;
  criticalHitThreshold: number;
  natural20Bonus: number;
  natural1Penalty: number;
  rangedMeleePenalty: number;
  longRangePenalty: number;
}

// ─── Skills and Defenses ──────────────────────────────────────────────────

export interface SkillsAndDefensesRules {
  maxSkillValue: number;
  baseSkillPastCapCost: number;
  subSkillPastCapCost: number;
  defenseIncreaseCost: number;
  speciesSkillCount: number;
  gainProficiencyCost: number;
  unproficientRules: { positive: string; negative: string };
}

// ─── Conditions ───────────────────────────────────────────────────────────

export interface ConditionDef {
  name: string;
  leveled: boolean;
  description: string;
}

export interface ConditionsRules {
  standard: ConditionDef[];
  leveled: ConditionDef[];
  stackingRules: string;
}

// ─── Sizes ────────────────────────────────────────────────────────────────

/** Full size category definition (used in game rules reference). Not to be confused with the SizeCategory union type in ancestry.ts. */
export interface SizeCategoryDef {
  value: string;
  label: string;
  height: string;
  spaces: number;
  baseCarry: number;
  perStrCarry: number;
  minCarry: number;
}

export interface SizesRules {
  categories: SizeCategoryDef[];
  halfCapacitySpeedPenalty: string;
}

// ─── Rarities ─────────────────────────────────────────────────────────────

export interface RarityTier {
  name: string;
  currencyMin: number;
  currencyMax: number | null;
  levelMin: number;
  levelMax: number | null;
}

export interface RaritiesRules {
  tiers: RarityTier[];
}

// ─── Damage Types ─────────────────────────────────────────────────────────

export interface DamageTypesRules {
  all: string[];
  armorExceptions: string[];
  note: string;
}

// ─── Recovery ─────────────────────────────────────────────────────────────

export interface RecoveryRules {
  partial: { duration: string; effect: string; interruptionGrace: string };
  full: { duration: string; effect: string };
  requirements: string;
  withoutFullRecovery: string;
  featUses: { partial: string; full: string };
}

// ─── Experience ───────────────────────────────────────────────────────────

export interface ExperienceRules {
  xpToLevelUp: string;
  levelTable: Array<{ level: number; xpThreshold: number }>;
  combatXp: string;
  skillEncounterXp: string;
  skillEncounterDS: string;
  skillEncounterSuccesses: string;
  divideXp: string;
}

// ─── Aggregate ────────────────────────────────────────────────────────────

/** All core rules categories, keyed by their DB row ID */
export interface CoreRulesMap {
  PROGRESSION_PLAYER: ProgressionPlayerRules;
  PROGRESSION_CREATURE: ProgressionCreatureRules;
  ABILITY_RULES: AbilityRules;
  ARCHETYPES: ArchetypeRules;
  ARMAMENT_PROFICIENCY: ArmamentProficiencyRules;
  COMBAT: CombatRules;
  SKILLS_AND_DEFENSES: SkillsAndDefensesRules;
  CONDITIONS: ConditionsRules;
  SIZES: SizesRules;
  RARITIES: RaritiesRules;
  DAMAGE_TYPES: DamageTypesRules;
  RECOVERY: RecoveryRules;
  EXPERIENCE: ExperienceRules;
}

export type CoreRulesCategory = keyof CoreRulesMap;
