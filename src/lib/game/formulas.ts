/**
 * Game Formulas
 * ==============
 * Centralized game calculation formulas for RealmsRPG
 * Ported from public/js/shared/game-formulas.js
 *
 * All functions accept an optional `rules` parameter (from useGameRules()).
 * When provided, DB-stored values are used. Otherwise, constants.ts fallbacks apply.
 */

import type { EntityType, Abilities } from '@/types';
import type { ArchetypeCategory, ProficiencyDerivedArchetype } from '@/types';
import type { CoreRulesMap, ArchetypeConfigRules } from '@/types/core-rules';
import {
  SHARED_CONSTANTS,
  PLAYER_CONSTANTS,
  CREATURE_CONSTANTS,
  ABILITY_LIMITS,
  ARCHETYPE_CONFIGS,
  ARMAMENT_PROFICIENCY_TABLE,
} from './constants';

// =============================================================================
// Optional rules shortcut — avoids verbose fallback chains
// =============================================================================

type Rules = Partial<CoreRulesMap>;

// =============================================================================
// Shared ability helpers
// =============================================================================

/**
 * Unproficient attribute bonus: a negative modifier is doubled (penalty), a
 * non-negative modifier is halved (rounded up). Single source of truth shared
 * by skill, sub-skill and attack-bonus calculations. (DUP-04)
 */
export function unproficientBonus(abilityMod: number): number {
  return abilityMod < 0 ? abilityMod * 2 : Math.ceil(abilityMod / 2);
}

// =============================================================================
// Level parsing
// =============================================================================

/**
 * Parse a level input without collapsing 0 to 1. Creature levels are legitimately
 * sub-1 (¼ / ½ / ¾ — see `creature-level-display.ts`), so `|| 1` would swallow both
 * 0 and the sub-level branch of every progression function.
 */
function parseLevel(level: number): number {
  const parsed = parseFloat(String(level));
  return Number.isFinite(parsed) ? parsed : 1;
}

// =============================================================================
// Level Progression Calculations
// =============================================================================

/**
 * Calculate ability points based on level.
 * Formula: 7 at level 1, +1 at level 3 and each 3 levels (3, 6, 9, 12...)
 */
export function calculateAbilityPoints(
  level: number,
  allowSubLevel = false,
  rules?: Rules,
): number {
  const parsedLevel = parseLevel(level);
  const base = rules?.PROGRESSION_PLAYER?.baseAbilityPoints ?? SHARED_CONSTANTS.BASE_ABILITY_POINTS;
  const perIncrease =
    rules?.PROGRESSION_PLAYER?.abilityPointsPerIncrease ??
    SHARED_CONSTANTS.ABILITY_POINTS_PER_3_LEVELS;
  const interval = rules?.PROGRESSION_PLAYER?.abilityPointsEveryNLevels ?? 3;

  if (allowSubLevel && parsedLevel < 1) {
    return Math.ceil(base * parsedLevel);
  }

  if (parsedLevel < 1) return 0;
  if (parsedLevel < interval) return base;

  const bonusPoints = Math.floor(parsedLevel / interval) * perIncrease;
  return base + bonusPoints;
}

/**
 * Skill points: characters 3/level. Creatures 5 at L1 + 3/level.
 */
export function calculateSkillPointsForEntity(
  level: number,
  entityType: 'character' | 'creature',
  rules?: Rules,
): number {
  const parsedLevel = Math.max(1, Math.floor(parseLevel(level)));
  if (entityType === 'creature') {
    const baseSkills =
      rules?.PROGRESSION_CREATURE?.skillPointsAtLevel1 ?? CREATURE_CONSTANTS.BASE_SKILL_POINTS;
    const perLevel =
      rules?.PROGRESSION_CREATURE?.skillPointsPerLevel ?? CREATURE_CONSTANTS.SKILL_POINTS_PER_LEVEL;
    return baseSkills + perLevel * (parsedLevel - 1);
  }
  const perLevel =
    rules?.PROGRESSION_PLAYER?.skillPointsPerLevel ?? SHARED_CONSTANTS.SKILL_POINTS_PER_LEVEL;
  return perLevel * parsedLevel;
}

/**
 * Calculate health-energy pool based on level.
 */
export function calculateHealthEnergyPool(
  level: number,
  entityType: EntityType = 'PLAYER',
  allowSubLevel = false,
  rules?: Rules,
): number {
  const parsedLevel = parseLevel(level);
  const basePool =
    entityType === 'CREATURE'
      ? (rules?.PROGRESSION_CREATURE?.baseHitEnergyPool ?? CREATURE_CONSTANTS.BASE_HIT_ENERGY)
      : (rules?.PROGRESSION_PLAYER?.baseHitEnergyPool ?? PLAYER_CONSTANTS.BASE_HIT_ENERGY);
  const perLevel =
    entityType === 'CREATURE'
      ? (rules?.PROGRESSION_CREATURE?.hitEnergyPerLevel ?? SHARED_CONSTANTS.HIT_ENERGY_PER_LEVEL)
      : (rules?.PROGRESSION_PLAYER?.hitEnergyPerLevel ?? SHARED_CONSTANTS.HIT_ENERGY_PER_LEVEL);

  if (allowSubLevel && parsedLevel < 1) {
    return Math.ceil(basePool * parsedLevel);
  }

  if (parsedLevel < 1) return 0;
  return basePool + perLevel * (parsedLevel - 1);
}

/**
 * Split a Health/Energy pool so max Energy can cover the highest Power/Technique
 * cost once; leftover pool points go to Health (TASK-729).
 */
export function allocateHealthEnergyPool(args: {
  baseEnergy: number;
  pool: number;
  highestEnergyCost: number;
}): { hpBonus: number; energyBonus: number } {
  const pool = Math.max(0, args.pool);
  const baseEnergy = Math.max(0, args.baseEnergy);
  const highestEnergyCost = Math.max(0, args.highestEnergyCost);
  const maxAchievableEnergy = baseEnergy + pool;
  const targetEnergy = Math.min(highestEnergyCost, maxAchievableEnergy);
  const energyBonus = Math.min(pool, Math.max(0, targetEnergy - baseEnergy));
  return { hpBonus: pool - energyBonus, energyBonus };
}

export type EnergyCostPick = {
  name: string;
  energy: number;
  kind: 'power' | 'technique';
};

/** Highest Energy-cost pick; ties keep the first. */
export function pickHighestEnergyCost(picks: EnergyCostPick[]): EnergyCostPick | null {
  let best: EnergyCostPick | null = null;
  for (const pick of picks) {
    if (!best || pick.energy > best.energy) best = pick;
  }
  return best;
}

/**
 * Calculate proficiency points based on level.
 * Formula: 2 + 1 every 5 levels starting at level 5
 */
export function calculateProficiency(level: number, allowSubLevel = false, rules?: Rules): number {
  const parsedLevel = parseLevel(level);
  const base = rules?.PROGRESSION_PLAYER?.baseProficiency ?? SHARED_CONSTANTS.BASE_PROFICIENCY;
  const perIncrease =
    rules?.PROGRESSION_PLAYER?.proficiencyPerIncrease ?? SHARED_CONSTANTS.PROFICIENCY_PER_5_LEVELS;
  const interval = rules?.PROGRESSION_PLAYER?.proficiencyEveryNLevels ?? 5;

  if (allowSubLevel && parsedLevel < 1) {
    return Math.ceil(base * parsedLevel);
  }

  if (parsedLevel < 1) return 0;
  if (parsedLevel < interval) return base;

  const bonusPoints = Math.floor(parsedLevel / interval) * perIncrease;
  return base + bonusPoints;
}

/**
 * Calculate training points for a player character.
 * Formula: 22 + ability + ((2 + ability) * (level - 1))
 */
export function calculateTrainingPoints(
  level: number,
  highestArchetypeAbility = 0,
  rules?: Rules,
): number {
  const ability = highestArchetypeAbility || 0;
  const base =
    rules?.PROGRESSION_PLAYER?.baseTrainingPoints ?? PLAYER_CONSTANTS.BASE_TRAINING_POINTS;
  const perLevel =
    (rules?.PROGRESSION_PLAYER?.tpPerLevelMultiplier ?? PLAYER_CONSTANTS.TP_PER_LEVEL_MULTIPLIER) +
    ability;

  return base + ability + perLevel * (level - 1);
}

/**
 * Calculate training points for a creature.
 */
export function calculateCreatureTrainingPoints(
  level: number,
  highestNonVitality = 0,
  rules?: Rules,
): number {
  const parsedLevel = parseLevel(level);
  const ability = highestNonVitality || 0;
  const base =
    rules?.PROGRESSION_CREATURE?.baseTrainingPoints ?? CREATURE_CONSTANTS.BASE_TRAINING_POINTS;
  const perLevel =
    (rules?.PROGRESSION_CREATURE?.tpPerLevelMultiplier ?? CREATURE_CONSTANTS.TP_PER_LEVEL) +
    ability;

  if (parsedLevel < 1) {
    return Math.ceil(base * parsedLevel) + ability;
  }

  if (parsedLevel <= 1) return base + ability;
  return base + ability + (parsedLevel - 1) * perLevel;
}

/**
 * Calculate creature feat points based on level and martial proficiency.
 */
export function calculateCreatureFeatPoints(
  level: number,
  martialProficiency = 0,
  rules?: Rules,
): number {
  const parsedLevel = parseLevel(level);
  const martial = martialProficiency || 0;
  const baseFeat =
    rules?.PROGRESSION_CREATURE?.baseFeatPoints ?? CREATURE_CONSTANTS.BASE_FEAT_POINTS;
  const perLevel =
    rules?.PROGRESSION_CREATURE?.featPointsPerLevel ?? CREATURE_CONSTANTS.FEAT_POINTS_PER_LEVEL;

  if (parsedLevel < 1) {
    return Math.ceil((baseFeat + martial) * parsedLevel);
  }

  const baseAtLevel1 = baseFeat + martial;
  const levelBonus = parsedLevel > 1 ? (parsedLevel - 1) * perLevel : 0;
  return baseAtLevel1 + levelBonus;
}

/**
 * Calculate creature currency based on level.
 */
export function calculateCreatureCurrency(level: number, rules?: Rules): number {
  const parsedLevel = parseLevel(level);
  const baseCurrency =
    rules?.PROGRESSION_CREATURE?.baseCurrency ?? CREATURE_CONSTANTS.BASE_CURRENCY;
  const growth =
    rules?.PROGRESSION_CREATURE?.currencyGrowthRate ?? CREATURE_CONSTANTS.CURRENCY_GROWTH;
  return Math.round(baseCurrency * Math.pow(growth, parsedLevel - 1));
}

/**
 * Maximum archetype feat slots: 1 per level plus the bonus tracked by
 * `calculateArchetypeProgression` (martial table, Powered-Martial joining bonus,
 * and Powered-Martial milestone **feat** picks). Pass `archetypeChoices` so
 * innate vs feat milestones are not a second answer (GAME_RULES "Archetype Feats").
 */
export function calculateMaxArchetypeFeats(
  level: number,
  archetypeType?: ArchetypeCategory,
  rules?: Rules,
  archetypeChoices?: Record<number, 'innate' | 'feat'>,
): number {
  const parsedLevel = Math.max(1, Math.floor(level));
  const config = getArchetypeConfig(archetypeType ?? 'power', rules);
  const progression = calculateArchetypeProgression(
    parsedLevel,
    config.proficiency.martial,
    config.proficiency.power,
    archetypeChoices ?? {},
    rules,
  );
  return parsedLevel + progression.bonusArchetypeFeats;
}

/**
 * Calculate maximum character feats allowed based on level.
 */
export function calculateMaxCharacterFeats(level: number): number {
  return Math.max(1, Math.floor(level));
}

/** Experience needed to reach the next level: level × 4 (GAME_RULES "Experience"). */
export function calculateXpToLevelUp(level: number): number {
  return Math.max(1, Math.floor(parseLevel(level))) * 4;
}

// =============================================================================
// Ability Score Helpers
// =============================================================================

/**
 * Get the cost to increase an ability score by 1 from currentValue.
 * e.g. 3→4 costs 1; 4→5 and above cost 2 (when threshold is 4).
 */
export function getAbilityIncreaseCost(currentValue: number, rules?: Rules): number {
  const threshold =
    rules?.ABILITY_RULES?.costIncreaseThreshold ?? ABILITY_LIMITS.COST_INCREASE_THRESHOLD;
  const increasedCost = rules?.ABILITY_RULES?.increasedCost ?? 2;
  const normalCost = rules?.ABILITY_RULES?.normalCost ?? 1;
  if (currentValue >= threshold) return increasedCost;
  return normalCost;
}

/**
 * Total ability points spent to reach a score (negative scores refund 1 per point).
 */
export function calculateAbilityScoreCost(value: number, rules?: Rules): number {
  if (value <= 0) return value;
  const threshold =
    rules?.ABILITY_RULES?.costIncreaseThreshold ?? ABILITY_LIMITS.COST_INCREASE_THRESHOLD;
  const increasedCost = rules?.ABILITY_RULES?.increasedCost ?? 2;
  const normalCost = rules?.ABILITY_RULES?.normalCost ?? 1;
  let spent = 0;
  for (let target = 1; target <= value; target++) {
    spent += target > threshold ? increasedCost : normalCost;
  }
  return spent;
}

/**
 * Check if an ability increase is valid.
 */
export function canIncreaseAbility(
  currentValue: number,
  availablePoints: number,
  isCreation = true,
  isCreature = false,
  rules?: Rules,
): boolean {
  const maxStarting = rules?.ABILITY_RULES?.maxStarting ?? ABILITY_LIMITS.MAX_STARTING;
  const maxChar = rules?.ABILITY_RULES?.maxAbsoluteCharacter ?? ABILITY_LIMITS.MAX_ABSOLUTE;
  const maxCreature =
    rules?.ABILITY_RULES?.maxAbsoluteCreature ?? ABILITY_LIMITS.MAX_ABSOLUTE_CREATURE;

  const max = isCreation ? maxStarting : isCreature ? maxCreature : maxChar;
  if (currentValue >= max) return false;

  const cost = getAbilityIncreaseCost(currentValue, rules);
  return availablePoints >= cost;
}

/**
 * Check if an ability decrease is valid.
 */
export function canDecreaseAbility(currentValue: number, rules?: Rules): boolean {
  const min = rules?.ABILITY_RULES?.min ?? ABILITY_LIMITS.MIN;
  return currentValue > min;
}

// =============================================================================
// Archetype Helpers
// =============================================================================

/**
 * Get archetype configuration.
 */
export function getArchetypeConfig(
  archetypeType: ArchetypeCategory | string,
  rules?: Rules,
): ArchetypeConfigRules {
  // Try DB rules first
  const dbConfigs = rules?.ARCHETYPES?.configs;
  if (dbConfigs) {
    const cfg = dbConfigs[archetypeType as ArchetypeCategory];
    if (cfg) return cfg;
  }
  // Fallback to constants
  return ARCHETYPE_CONFIGS[archetypeType as ArchetypeCategory] || ARCHETYPE_CONFIGS.power;
}

/**
 * Get the maximum armament value for an archetype.
 */
export function getArmamentMax(
  archetype: ArchetypeCategory | { type?: ArchetypeCategory },
  rules?: Rules,
): number {
  const type = typeof archetype === 'string' ? archetype : archetype?.type;
  return getArchetypeConfig(type || 'power', rules).armamentMax;
}

/**
 * Level-1 Power / Martial Proficiency: path columns when present, else type defaults
 * (Power 2/0, Martial 0/2, Powered-Martial 1/1). Shared by Guided save and Advanced
 * path select so the same codex row cannot produce two different characters.
 */
export function resolveArchetypeProficiencyStart(
  type: ArchetypeCategory | string | null | undefined,
  archetype?: {
    power_prof_start?: number | null;
    martial_prof_start?: number | null;
  } | null,
): { pow_prof: number; mart_prof: number } {
  const t = (type || 'power') as ArchetypeCategory;
  const powDefault = t === 'power' ? 2 : t === 'powered-martial' ? 1 : 0;
  const martDefault = t === 'martial' ? 2 : t === 'powered-martial' ? 1 : 0;
  return {
    pow_prof: archetype?.power_prof_start ?? powDefault,
    mart_prof: archetype?.martial_prof_start ?? martDefault,
  };
}

/**
 * Calculate armament proficiency based on martial proficiency.
 */
export function calculateArmamentProficiency(martialProf: number, rules?: Rules): number {
  const table =
    rules?.ARMAMENT_PROFICIENCY?.table && rules.ARMAMENT_PROFICIENCY.table.length > 0
      ? rules.ARMAMENT_PROFICIENCY.table
      : ARMAMENT_PROFICIENCY_TABLE;
  const sorted = [...table].sort((a, b) => a.martialProf - b.martialProf);
  for (let i = sorted.length - 1; i >= 0; i--) {
    const row = sorted[i];
    if (row === undefined) continue;
    if (row.martialProf <= martialProf) return row.armamentMax;
  }
  return sorted[0]?.armamentMax ?? ARCHETYPE_CONFIGS.power.armamentMax;
}

/**
 * Get archetype type based on martial and power proficiency.
 */
export function getArchetypeType(
  martialProf: number,
  powerProf: number,
): ProficiencyDerivedArchetype {
  if (martialProf === 0 && powerProf > 0) return 'power';
  if (powerProf === 0 && martialProf > 0) return 'martial';
  if (martialProf > 0 && powerProf > 0) return 'powered-martial';
  return 'none';
}

/**
 * Calculate base innate threshold for pure power archetype.
 */
export function calculateBaseInnateThreshold(level: number, rules?: Rules): number {
  const base = rules?.ARCHETYPES?.configs?.power?.innateThreshold ?? 8;
  const interval = rules?.ARCHETYPES?.poweredMartialMilestoneInterval ?? 3;
  const startLevel = rules?.ARCHETYPES?.poweredMartialMilestoneStartLevel ?? 4;
  if (level < startLevel) return base;
  const bonuses = Math.floor((level - 1) / interval);
  return base + bonuses;
}

/**
 * Calculate base innate pools for pure power archetype.
 */
export function calculateBaseInnatePools(level: number, rules?: Rules): number {
  const base = rules?.ARCHETYPES?.configs?.power?.innatePools ?? 2;
  const interval = rules?.ARCHETYPES?.poweredMartialMilestoneInterval ?? 3;
  const startLevel = rules?.ARCHETYPES?.poweredMartialMilestoneStartLevel ?? 4;
  if (level < startLevel) return base;
  const bonuses = Math.floor((level - 1) / interval);
  return base + bonuses;
}

/**
 * Calculate bonus archetype feats for pure martial archetype.
 */
export function calculateBonusArchetypeFeats(level: number, rules?: Rules): number {
  const base = rules?.ARCHETYPES?.martialBonusFeatsBase ?? 2;
  const interval = rules?.ARCHETYPES?.martialBonusFeatsInterval ?? 3;
  const startLevel = rules?.ARCHETYPES?.martialBonusFeatsStartLevel ?? 4;
  if (level < startLevel) return base;
  const bonuses = Math.floor((level - 1) / interval);
  return base + bonuses;
}

/**
 * Get milestone levels for mixed archetype choices.
 */
export function getArchetypeMilestoneLevels(currentLevel: number, rules?: Rules): number[] {
  const startLevel = rules?.ARCHETYPES?.poweredMartialMilestoneStartLevel ?? 4;
  const interval = rules?.ARCHETYPES?.poweredMartialMilestoneInterval ?? 3;
  const milestones: number[] = [];
  for (let lvl = startLevel; lvl <= currentLevel; lvl += interval) {
    milestones.push(lvl);
  }
  return milestones;
}

export interface ArchetypeProgression {
  archetype: ProficiencyDerivedArchetype;
  armamentProficiency: number;
  innateThreshold: number;
  innatePools: number;
  innateEnergy: number;
  bonusArchetypeFeats: number;
  availableMilestones: number[];
}

/**
 * Calculate complete archetype progression based on proficiencies and choices.
 */
export function calculateArchetypeProgression(
  level: number,
  martialProf: number,
  powerProf: number,
  archetypeChoices: Record<number, 'innate' | 'feat'> = {},
  rules?: Rules,
): ArchetypeProgression {
  const archetype = getArchetypeType(martialProf, powerProf);
  const armamentProficiency = calculateArmamentProficiency(martialProf, rules);

  let innateThreshold = 0;
  let innatePools = 0;
  let innateEnergy = 0;
  let bonusArchetypeFeats = 0;

  const mixedConfig = getArchetypeConfig('powered-martial', rules);

  switch (archetype) {
    case 'power':
      innateThreshold = calculateBaseInnateThreshold(level, rules);
      innatePools = calculateBaseInnatePools(level, rules);
      innateEnergy = innateThreshold * innatePools;
      break;

    case 'martial':
      bonusArchetypeFeats = calculateBonusArchetypeFeats(level, rules);
      break;

    case 'powered-martial':
      innateThreshold = mixedConfig.innateThreshold;
      innatePools = mixedConfig.innatePools;
      bonusArchetypeFeats = mixedConfig.featLimit;

      const milestones = getArchetypeMilestoneLevels(level, rules);
      for (const milestoneLevel of milestones) {
        const choice = archetypeChoices[milestoneLevel];
        if (choice === 'innate') {
          // GAME_RULES: first Increase Innate Power is 6→8; later picks +1.
          innateThreshold = innateThreshold < 8 ? 8 : innateThreshold + 1;
          innatePools += 1;
        } else if (choice === 'feat') {
          bonusArchetypeFeats += 1;
        }
      }

      innateEnergy = innateThreshold * innatePools;
      break;

    default:
      break;
  }

  return {
    archetype,
    armamentProficiency,
    innateThreshold,
    innatePools,
    innateEnergy,
    bonusArchetypeFeats,
    availableMilestones:
      archetype === 'powered-martial' ? getArchetypeMilestoneLevels(level, rules) : [],
  };
}

/** Sum energy costs of powers marked innate (innate energy budget spent). */
export function sumInnatePowerEnergyCosts(
  powers: Array<{ innate?: boolean; cost?: number }> = [],
): number {
  return powers.filter((p) => p.innate === true).reduce((sum, p) => sum + (p.cost ?? 0), 0);
}

/** Remaining innate energy budget after innate power costs. */
export function calculateRemainingInnateEnergy(
  maxInnateEnergy: number,
  powers: Array<{ innate?: boolean; cost?: number }> = [],
): number {
  return maxInnateEnergy - sumInnatePowerEnergyCosts(powers);
}

// =============================================================================
// Skill Helpers
// =============================================================================

const ABILITY_MAP: Record<string, keyof Abilities> = {
  strength: 'strength',
  vitality: 'vitality',
  agility: 'agility',
  acuity: 'acuity',
  intelligence: 'intelligence',
  charisma: 'charisma',
};

/**
 * Normalize linked abilities to an array of ability keys (keyof Abilities).
 * Exported for UI (e.g. ability selector for multi-ability skills).
 */
export function getLinkedAbilityKeys(
  linkedAbilities: string | string[] | undefined,
): (keyof Abilities)[] {
  if (!linkedAbilities) return [];
  const arr = Array.isArray(linkedAbilities)
    ? linkedAbilities
    : linkedAbilities.split(',').map((a) => a.trim());
  return arr
    .map((a) => ABILITY_MAP[a.toLowerCase()])
    .filter((key): key is keyof Abilities => !!key);
}

/**
 * Get the highest ability modifier from a list of linked abilities.
 */
export function getHighestLinkedAbility(
  linkedAbilities: string | string[] | undefined,
  abilities: Abilities,
): number {
  const keys = getLinkedAbilityKeys(linkedAbilities);
  if (keys.length === 0) return 0;
  let max = -Infinity;
  for (const key of keys) {
    const value = abilities[key];
    if (value !== undefined && value > max) max = value;
  }
  return max === -Infinity ? 0 : max;
}

/**
 * Get the ability key with the highest value for linked abilities (for default ability selection).
 */
export function getHighestLinkedAbilityKey(
  linkedAbilities: string | string[] | undefined,
  abilities: Abilities,
): keyof Abilities | undefined {
  const keys = getLinkedAbilityKeys(linkedAbilities);
  if (keys.length === 0) return undefined;
  let best: keyof Abilities | undefined;
  let max = -Infinity;
  for (const key of keys) {
    const value = abilities[key];
    if (value !== undefined && value > max) {
      max = value;
      best = key;
    }
  }
  return best;
}

/**
 * Get ability modifier for a skill: use chosen key if provided and valid, else highest.
 */
export function getLinkedAbilityMod(
  linkedAbilities: string | string[] | undefined,
  abilities: Abilities,
  chosenAbilityKey?: string,
): number {
  const keys = getLinkedAbilityKeys(linkedAbilities);
  if (keys.length === 0) return 0;
  if (chosenAbilityKey && keys.includes(chosenAbilityKey as keyof Abilities)) {
    const v = abilities[chosenAbilityKey as keyof Abilities];
    return v ?? 0;
  }
  return getHighestLinkedAbility(linkedAbilities, abilities);
}

/**
 * Calculate total skill bonus including proficiency.
 * @param chosenAbilityKey - If skill has multiple abilities, use this one; else use highest.
 */
export function calculateSkillBonusWithProficiency(
  linkedAbilities: string | string[] | undefined,
  skillValue: number,
  abilities: Abilities,
  isProficient: boolean = false,
  chosenAbilityKey?: string,
): number {
  const abilityMod = getLinkedAbilityMod(linkedAbilities, abilities, chosenAbilityKey);

  if (isProficient) {
    return abilityMod + skillValue;
  }
  return unproficientBonus(abilityMod);
}

/** Codex row shape for resolving a sub-skill's parent skill name (character save omits `baseSkill` string). */
export interface CodexSkillParentRef {
  id: string | number;
  name?: string;
}

/**
 * Resolve parent base skill display name for a sub-skill from codex + saved `selectedBaseSkillId` (any-base sub-skills).
 * Character `cleanForSave` strips `baseSkill`; re-attach before sheet bonus math (GAME_RULES: ability + base value + sub value).
 */
export function resolveParentSkillNameForSubSkill(
  saved: { selectedBaseSkillId?: string },
  codexSkill: { base_skill_id?: number | string } | undefined,
  codexSkills: CodexSkillParentRef[],
): string | undefined {
  if (saved.selectedBaseSkillId != null && String(saved.selectedBaseSkillId) !== '') {
    const p = codexSkills.find((s) => String(s.id) === String(saved.selectedBaseSkillId));
    if (p?.name) return p.name;
  }
  const bid = codexSkill?.base_skill_id;
  if (bid !== undefined && bid !== null && Number(bid) !== 0) {
    const p = codexSkills.find((s) => String(s.id) === String(bid));
    if (p?.name) return p.name;
  }
  return undefined;
}

/**
 * Calculate sub-skill bonus.
 * @param chosenAbilityKey - If skill has multiple abilities, use this one; else use highest.
 */
export function calculateSubSkillBonusWithProficiency(
  linkedAbilities: string | string[] | undefined,
  subSkillValue: number,
  baseSkillValue: number,
  baseSkillProficient: boolean,
  abilities: Abilities,
  isProficient: boolean,
  chosenAbilityKey?: string,
): number {
  const abilityMod = getLinkedAbilityMod(linkedAbilities, abilities, chosenAbilityKey);

  if (!baseSkillProficient) {
    return unproficientBonus(abilityMod) + baseSkillValue;
  }
  if (isProficient) {
    return abilityMod + baseSkillValue + subSkillValue;
  }
  return abilityMod + baseSkillValue;
}

/** Codex skill shape for feat requirement resolution */
export interface CodexSkillForFeat {
  id: string | number;
  name?: string;
  base_skill_id?: number | string;
  ability?: string;
}

/**
 * Get character skill bonus and proficiency for a given skill ID (for feat requirement checks).
 * skill_req_val is the required SKILL BONUS (not skill value). All skill requirements also require proficiency.
 * @param skillId - Codex skill ID (from feat.skill_req)
 * @param abilities - Character/draft abilities
 * @param skills - Character: Record<id, { prof, val }>; Draft: Record<id, value (number)> where base skills use 0+ as proficient (0 = proficient, no ranks) and sub-skills use 1+ (0 = unproficient / absent)
 * @param codexSkills - Full codex skills to resolve base/sub and ability
 * @returns { bonus, proficient } - bonus is the effective skill bonus; proficient is whether they meet the base proficiency requirement
 */
export function getSkillBonusForFeatRequirement(
  skillId: string,
  abilities: Partial<Abilities> | Abilities,
  skills: Record<string, number | { prof?: boolean; val?: number }>,
  codexSkills: CodexSkillForFeat[],
): { bonus: number; proficient: boolean } {
  // Look up by ID first, then fall back to name match (feat data may use either)
  const codexSkill =
    codexSkills.find((s) => String(s.id) === String(skillId)) ||
    codexSkills.find(
      (s) => s.name != null && s.name.toLowerCase() === String(skillId).toLowerCase(),
    );
  if (!codexSkill) return { bonus: 0, proficient: false };

  const getVal = (key: string): number => {
    const s = skills[key];
    if (s == null) return 0;
    return typeof s === 'number' ? s : (s?.val ?? 0);
  };
  /** Draft numeric allocations: base skill proficient if value >= 0; sub-skill if >= 1 (matches SkillsAllocationPage). */
  const readProficiency = (key: string, allocUsesSubRules: boolean): boolean => {
    const s = skills[key];
    if (s == null) return false;
    if (typeof s === 'number') {
      return allocUsesSubRules ? s >= 1 : s >= 0;
    }
    return s?.prof ?? false;
  };

  const baseSkillId =
    codexSkill.base_skill_id != null ? String(codexSkill.base_skill_id) : undefined;
  const featTargetsSubSkill = Boolean(baseSkillId);

  // Resolve key: character may key by id or by name
  const byId = skills[String(skillId)] != null;
  const byName = codexSkill.name && skills[String(codexSkill.name)] != null;
  const skillKey = byId ? String(skillId) : byName ? String(codexSkill.name) : String(skillId);
  const value =
    getVal(skillKey) ||
    getVal(String(skillId)) ||
    (codexSkill.name ? getVal(String(codexSkill.name)) : 0);
  const proficient =
    readProficiency(skillKey, featTargetsSubSkill) ||
    readProficiency(String(skillId), featTargetsSubSkill) ||
    (codexSkill.name ? readProficiency(String(codexSkill.name), featTargetsSubSkill) : false);

  const abilityKey = (codexSkill.ability?.split(',')[0]?.trim()?.toLowerCase() ||
    'strength') as keyof Abilities;
  const abilityMod = abilities[abilityKey] ?? 0;

  if (baseSkillId) {
    // Sub-skill: need base skill value and proficiency
    const baseCodex = codexSkills.find((s) => String(s.id) === baseSkillId);
    const baseKeyById = skills[baseSkillId] != null;
    const baseKeyByName = baseCodex?.name && skills[String(baseCodex.name)] != null;
    const baseKey = baseKeyById
      ? baseSkillId
      : baseKeyByName
        ? String(baseCodex!.name)
        : baseSkillId;
    const baseValue =
      getVal(baseKey) ||
      getVal(baseSkillId) ||
      (baseCodex?.name ? getVal(String(baseCodex.name)) : 0);
    const baseProficient =
      readProficiency(baseKey, false) ||
      readProficiency(baseSkillId, false) ||
      (baseCodex?.name ? readProficiency(String(baseCodex.name), false) : false);
    if (!baseProficient) {
      return { bonus: unproficientBonus(abilityMod) + baseValue, proficient: false };
    }
    const bonus = abilityMod + baseValue + value;
    return { bonus, proficient: proficient && value >= 1 };
  }

  // Base skill
  if (!proficient) {
    return { bonus: unproficientBonus(abilityMod), proficient: false };
  }
  return { bonus: abilityMod + value, proficient: true };
}
