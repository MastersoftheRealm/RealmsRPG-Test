/**
 * Game Formulas
 * ==============
 * Centralized game calculation formulas for RealmsRPG
 * Ported from public/js/shared/game-formulas.js
 *
 * All functions accept an optional `rules` parameter (from useGameRules()).
 * When provided, DB-stored values are used. Otherwise, constants.ts fallbacks apply.
 */

import type { EntityType, Abilities, ArchetypeCategory, Character } from '@/types';
import type { CoreRulesMap, ArchetypeConfigRules } from '@/types/core-rules';
import { 
  SHARED_CONSTANTS, 
  PLAYER_CONSTANTS, 
  CREATURE_CONSTANTS, 
  ABILITY_LIMITS,
  ARCHETYPE_CONFIGS,
} from './constants';

// =============================================================================
// Optional rules shortcut — avoids verbose fallback chains
// =============================================================================

type Rules = Partial<CoreRulesMap>;

// =============================================================================
// Level Progression Calculations
// =============================================================================

/**
 * Calculate ability points based on level.
 * Formula: 7 at level 1, +1 at level 3 and each 3 levels (3, 6, 9, 12...)
 */
export function calculateAbilityPoints(level: number, allowSubLevel = false, rules?: Rules): number {
  const parsedLevel = parseFloat(String(level)) || 1;
  const base = rules?.PROGRESSION_PLAYER?.baseAbilityPoints ?? SHARED_CONSTANTS.BASE_ABILITY_POINTS;
  const perIncrease = rules?.PROGRESSION_PLAYER?.abilityPointsPerIncrease ?? SHARED_CONSTANTS.ABILITY_POINTS_PER_3_LEVELS;
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
 * @deprecated Use calculateSkillPointsForEntity() instead.
 */
export function calculateSkillPoints(level: number, allowSubLevel = false): number {
  const parsedLevel = parseFloat(String(level)) || 1;
  
  if (allowSubLevel && parsedLevel < 1) {
    return Math.ceil(5 * parsedLevel);
  }
  
  return SHARED_CONSTANTS.BASE_SKILL_POINTS + 
         (SHARED_CONSTANTS.SKILL_POINTS_PER_LEVEL * Math.floor(parsedLevel));
}

/**
 * Skill points: characters 3/level. Creatures 5 at L1 + 3/level.
 */
export function calculateSkillPointsForEntity(
  level: number,
  entityType: 'character' | 'creature',
  rules?: Rules
): number {
  const parsedLevel = Math.max(1, Math.floor(parseFloat(String(level)) || 1));
  if (entityType === 'creature') {
    const baseSkills = rules?.PROGRESSION_CREATURE?.skillPointsAtLevel1 ?? CREATURE_CONSTANTS.BASE_SKILL_POINTS;
    const perLevel = rules?.PROGRESSION_CREATURE?.skillPointsPerLevel ?? CREATURE_CONSTANTS.SKILL_POINTS_PER_LEVEL;
    return baseSkills + perLevel * (parsedLevel - 1);
  }
  const perLevel = rules?.PROGRESSION_PLAYER?.skillPointsPerLevel ?? SHARED_CONSTANTS.SKILL_POINTS_PER_LEVEL;
  return perLevel * parsedLevel;
}

/**
 * Calculate health-energy pool based on level.
 */
export function calculateHealthEnergyPool(
  level: number, 
  entityType: EntityType = 'PLAYER', 
  allowSubLevel = false,
  rules?: Rules
): number {
  const parsedLevel = parseFloat(String(level)) || 1;
  const basePool = entityType === 'CREATURE'
    ? (rules?.PROGRESSION_CREATURE?.baseHitEnergyPool ?? CREATURE_CONSTANTS.BASE_HIT_ENERGY)
    : (rules?.PROGRESSION_PLAYER?.baseHitEnergyPool ?? PLAYER_CONSTANTS.BASE_HIT_ENERGY);
  const perLevel = entityType === 'CREATURE'
    ? (rules?.PROGRESSION_CREATURE?.hitEnergyPerLevel ?? SHARED_CONSTANTS.HIT_ENERGY_PER_LEVEL)
    : (rules?.PROGRESSION_PLAYER?.hitEnergyPerLevel ?? SHARED_CONSTANTS.HIT_ENERGY_PER_LEVEL);
  
  if (allowSubLevel && parsedLevel < 1) {
    return Math.ceil(basePool * parsedLevel);
  }
  
  return basePool + (perLevel * (parsedLevel - 1));
}

/**
 * Calculate proficiency points based on level.
 * Formula: 2 + 1 every 5 levels starting at level 5
 */
export function calculateProficiency(level: number, allowSubLevel = false, rules?: Rules): number {
  const parsedLevel = parseFloat(String(level)) || 1;
  const base = rules?.PROGRESSION_PLAYER?.baseProficiency ?? SHARED_CONSTANTS.BASE_PROFICIENCY;
  const perIncrease = rules?.PROGRESSION_PLAYER?.proficiencyPerIncrease ?? SHARED_CONSTANTS.PROFICIENCY_PER_5_LEVELS;
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
export function calculateTrainingPoints(level: number, highestArchetypeAbility = 0, rules?: Rules): number {
  const ability = highestArchetypeAbility || 0;
  const base = rules?.PROGRESSION_PLAYER?.baseTrainingPoints ?? PLAYER_CONSTANTS.BASE_TRAINING_POINTS;
  const perLevel = (rules?.PROGRESSION_PLAYER?.tpPerLevelMultiplier ?? PLAYER_CONSTANTS.TP_PER_LEVEL_MULTIPLIER) + ability;
  
  return base + ability + (perLevel * (level - 1));
}

/**
 * Calculate training points for a creature.
 */
export function calculateCreatureTrainingPoints(level: number, highestNonVitality = 0, rules?: Rules): number {
  const parsedLevel = parseFloat(String(level)) || 1;
  const ability = highestNonVitality || 0;
  const base = rules?.PROGRESSION_CREATURE?.baseTrainingPoints ?? CREATURE_CONSTANTS.BASE_TRAINING_POINTS;
  const perLevel = (rules?.PROGRESSION_CREATURE?.tpPerLevelMultiplier ?? CREATURE_CONSTANTS.TP_PER_LEVEL) + ability;
  
  if (parsedLevel < 1) {
    return Math.ceil(base * parsedLevel) + ability;
  }
  
  if (parsedLevel <= 1) return base + ability;
  return base + ability + ((parsedLevel - 1) * perLevel);
}

/**
 * Calculate creature feat points based on level and martial proficiency.
 */
export function calculateCreatureFeatPoints(level: number, martialProficiency = 0, rules?: Rules): number {
  const parsedLevel = parseFloat(String(level)) || 1;
  const martial = martialProficiency || 0;
  const baseFeat = rules?.PROGRESSION_CREATURE?.baseFeatPoints ?? 1.5;
  
  if (parsedLevel < 1) {
    return Math.ceil((baseFeat + martial) * parsedLevel);
  }
  
  const baseAtLevel1 = baseFeat + martial;
  const levelBonus = parsedLevel > 1 ? (parsedLevel - 1) : 0;
  return baseAtLevel1 + levelBonus;
}

/**
 * Calculate creature currency based on level.
 */
export function calculateCreatureCurrency(level: number, rules?: Rules): number {
  const parsedLevel = parseFloat(String(level)) || 1;
  const baseCurrency = rules?.PROGRESSION_CREATURE?.baseCurrency ?? CREATURE_CONSTANTS.BASE_CURRENCY;
  const growth = rules?.PROGRESSION_CREATURE?.currencyGrowthRate ?? CREATURE_CONSTANTS.CURRENCY_GROWTH;
  return Math.round(baseCurrency * Math.pow(growth, parsedLevel - 1));
}

/**
 * Calculate maximum archetype feats allowed based on level and archetype type.
 */
export function calculateMaxArchetypeFeats(
  level: number, 
  archetypeType?: ArchetypeCategory,
  rules?: Rules
): number {
  const parsedLevel = Math.max(1, Math.floor(level));
  const martialBase = rules?.ARCHETYPES?.martialBonusFeatsBase ?? 2;
  const martialInterval = rules?.ARCHETYPES?.martialBonusFeatsInterval ?? 3;
  
  if (archetypeType === 'martial') {
    const martialBonus = martialBase + Math.floor((parsedLevel - 1) / martialInterval);
    return parsedLevel + martialBonus;
  }
  
  if (archetypeType === 'powered-martial') {
    return parsedLevel + 1;
  }
  
  return parsedLevel;
}

/**
 * Calculate maximum character feats allowed based on level.
 */
export function calculateMaxCharacterFeats(level: number): number {
  return Math.max(1, Math.floor(level));
}

// =============================================================================
// Ability Score Helpers
// =============================================================================

/**
 * Get the cost to increase an ability score.
 */
export function getAbilityIncreaseCost(currentValue: number, rules?: Rules): number {
  const threshold = rules?.ABILITY_RULES?.costIncreaseThreshold ?? ABILITY_LIMITS.COST_INCREASE_THRESHOLD;
  const increasedCost = rules?.ABILITY_RULES?.increasedCost ?? 2;
  const normalCost = rules?.ABILITY_RULES?.normalCost ?? 1;
  if (currentValue >= threshold) return increasedCost;
  return normalCost;
}

/**
 * Check if an ability increase is valid.
 */
export function canIncreaseAbility(
  currentValue: number, 
  availablePoints: number, 
  isCreation = true,
  isCreature = false,
  rules?: Rules
): boolean {
  const maxStarting = rules?.ABILITY_RULES?.maxStarting ?? ABILITY_LIMITS.MAX_STARTING;
  const maxChar = rules?.ABILITY_RULES?.maxAbsoluteCharacter ?? ABILITY_LIMITS.MAX_ABSOLUTE;
  const maxCreature = rules?.ABILITY_RULES?.maxAbsoluteCreature ?? ABILITY_LIMITS.MAX_ABSOLUTE_CREATURE;
  
  const max = isCreation ? maxStarting : (isCreature ? maxCreature : maxChar);
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
export function getArchetypeConfig(archetypeType: ArchetypeCategory | string, rules?: Rules): ArchetypeConfigRules {
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
export function getArmamentMax(archetype: ArchetypeCategory | { type?: ArchetypeCategory }, rules?: Rules): number {
  const type = typeof archetype === 'string' ? archetype : archetype?.type;
  return getArchetypeConfig(type || 'power', rules).armamentMax;
}

/**
 * Calculate armament proficiency based on martial proficiency.
 */
export function calculateArmamentProficiency(martialProf: number, rules?: Rules): number {
  // Try DB lookup table first
  const table = rules?.ARMAMENT_PROFICIENCY?.table;
  if (table && table.length > 0) {
    // Find exact match or highest entry below martialProf
    const sorted = [...table].sort((a, b) => a.martialProf - b.martialProf);
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].martialProf <= martialProf) return sorted[i].armamentMax;
    }
    return sorted[0]?.armamentMax ?? 3;
  }
  
  // Fallback to hardcoded formula
  if (martialProf === 0) return 3;
  if (martialProf === 1) return 8;
  if (martialProf === 2) return 12;
  return 12 + (3 * (martialProf - 2));
}

/**
 * Get archetype type based on martial and power proficiency.
 */
export function getArchetypeType(martialProf: number, powerProf: number): 'power' | 'martial' | 'mixed' | 'none' {
  if (martialProf === 0 && powerProf > 0) return 'power';
  if (powerProf === 0 && martialProf > 0) return 'martial';
  if (martialProf > 0 && powerProf > 0) return 'mixed';
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
  archetype: 'power' | 'martial' | 'mixed' | 'none';
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
  rules?: Rules
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
      
    case 'mixed':
      innateThreshold = mixedConfig.innateThreshold;
      innatePools = mixedConfig.innatePools;
      bonusArchetypeFeats = mixedConfig.featLimit;
      
      const milestones = getArchetypeMilestoneLevels(level, rules);
      for (const milestoneLevel of milestones) {
        const choice = archetypeChoices[milestoneLevel];
        if (choice === 'innate') {
          innateThreshold += 1;
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
    availableMilestones: archetype === 'mixed' ? getArchetypeMilestoneLevels(level, rules) : [],
  };
}

/**
 * Calculate power potency: 10 + power proficiency + power ability score.
 */
export function calculatePowerPotency(powerProf: number, powerAbilityScore: number): number {
  return 10 + powerProf + powerAbilityScore;
}

/**
 * Get the archetype feat limit.
 */
export function getArchetypeFeatLimit(archetype: ArchetypeCategory | { type?: ArchetypeCategory }, rules?: Rules): number {
  const type = typeof archetype === 'string' ? archetype : archetype?.type;
  return getArchetypeConfig(type || 'power', rules).featLimit;
}

/**
 * Get the maximum innate energy for an archetype.
 */
export function getInnateEnergyMax(archetype: ArchetypeCategory | { type?: ArchetypeCategory }, rules?: Rules): number {
  const type = typeof archetype === 'string' ? archetype : archetype?.type;
  return getArchetypeConfig(type || 'power', rules).innateEnergy;
}

/**
 * Get the archetype ability score.
 */
export function getArchetypeAbility(
  archetype: { type?: string; pow_abil?: string; mart_abil?: string } | undefined,
  abilities: Partial<Abilities>
): number {
  if (!archetype?.type) return 0;
  
  if (archetype.type === 'powered-martial') {
    const pow = archetype.pow_abil?.toLowerCase() as keyof Abilities;
    const mar = archetype.mart_abil?.toLowerCase() as keyof Abilities;
    const powVal = pow ? (abilities[pow] || 0) : 0;
    const marVal = mar ? (abilities[mar] || 0) : 0;
    return Math.max(powVal, marVal);
  }
  
  const abilityKey = (archetype.pow_abil || archetype.mart_abil)?.toLowerCase() as keyof Abilities;
  return abilityKey ? (abilities[abilityKey] || 0) : 0;
}

/**
 * @deprecated Use calculateMaxHealth() from @/lib/game/calculations instead.
 */
export function getBaseHealth(
  archetype: { type?: string; pow_abil?: string; mart_abil?: string } | undefined,
  abilities: Partial<Abilities>,
  rules?: Rules
): number {
  const baseHealth = rules?.PROGRESSION_PLAYER?.baseHealth ?? 8;
  const vitality = abilities.vitality || 0;
  
  const isVitalityArchetype = 
    archetype?.pow_abil?.toLowerCase() === 'vitality' ||
    archetype?.mart_abil?.toLowerCase() === 'vitality';
  
  if (isVitalityArchetype) {
    return baseHealth + (abilities.strength || 0);
  }
  
  return baseHealth + vitality;
}

/**
 * @deprecated Use calculateMaxEnergy() from @/lib/game/calculations instead.
 */
export function getBaseEnergy(
  archetype: { type?: string; pow_abil?: string; mart_abil?: string } | undefined,
  abilities: Partial<Abilities>
): number {
  return getArchetypeAbility(archetype, abilities);
}

/**
 * @deprecated Use computeMaxHealthEnergy() from @/lib/game/calculations instead.
 */
export function getCharacterMaxHealthEnergy(charData: Record<string, unknown>): {
  maxHealth: number;
  maxEnergy: number;
} {
  const rawAbilities = (charData.abilities || {}) as Record<string, number>;
  const abilities: Partial<Abilities> = {
    ...rawAbilities,
    acuity: rawAbilities.acuity ?? rawAbilities.acu ?? 0,
    agility: rawAbilities.agility ?? rawAbilities.agi ?? 0,
  };
  const level = (charData.level as number) ?? 1;
  const healthPoints = (charData.healthPoints as number) ?? 0;
  const energyPoints = (charData.energyPoints as number) ?? 0;
  const archetype = charData.archetype as { type?: string; pow_abil?: string; mart_abil?: string } | undefined;

  const baseHealth = getBaseHealth(archetype, abilities);
  const healthAbility = baseHealth - 8;
  const maxHealth = healthAbility < 0
    ? 8 + healthAbility + healthPoints
    : 8 + healthAbility * level + healthPoints;

  const archetypeAbilityValue = getArchetypeAbility(archetype, abilities);
  const maxEnergy = archetypeAbilityValue * level + energyPoints;

  return { maxHealth, maxEnergy };
}

// =============================================================================
// Skill Helpers
// =============================================================================

const ABILITY_MAP: Record<string, keyof Abilities> = {
  'strength': 'strength',
  'vitality': 'vitality', 
  'agility': 'agility',
  'acuity': 'acuity',
  'intelligence': 'intelligence',
  'charisma': 'charisma',
};

/**
 * Get the highest ability modifier from a list of linked abilities.
 */
export function getHighestLinkedAbility(
  linkedAbilities: string | string[] | undefined,
  abilities: Abilities
): number {
  if (!linkedAbilities) return 0;
  
  const abilityArray = Array.isArray(linkedAbilities) 
    ? linkedAbilities 
    : linkedAbilities.split(',').map(a => a.trim());
  
  if (abilityArray.length === 0) return 0;
  
  let max = -Infinity;
  for (const ability of abilityArray) {
    const key = ABILITY_MAP[ability.toLowerCase()];
    if (key && abilities[key] !== undefined) {
      const value = abilities[key];
      if (value > max) max = value;
    }
  }
  
  return max === -Infinity ? 0 : max;
}

/**
 * Calculate skill bonus: highest linked ability + skill value.
 */
export function calculateSkillBonus(
  linkedAbilities: string | string[] | undefined,
  skillValue: number,
  abilities: Abilities
): number {
  const abilityMod = getHighestLinkedAbility(linkedAbilities, abilities);
  return abilityMod + skillValue;
}

/**
 * Calculate total skill bonus including proficiency.
 */
export function calculateSkillBonusWithProficiency(
  linkedAbilities: string | string[] | undefined,
  skillValue: number,
  abilities: Abilities,
  isProficient: boolean = false
): number {
  const abilityMod = getHighestLinkedAbility(linkedAbilities, abilities);
  
  if (isProficient) {
    return abilityMod + skillValue;
  } else {
    const unprofAbilityBonus = abilityMod < 0 ? abilityMod * 2 : Math.ceil(abilityMod / 2);
    return unprofAbilityBonus;
  }
}

/**
 * Calculate sub-skill bonus.
 */
export function calculateSubSkillBonusWithProficiency(
  linkedAbilities: string | string[] | undefined,
  subSkillValue: number,
  baseSkillValue: number,
  baseSkillProficient: boolean,
  abilities: Abilities,
  isProficient: boolean
): number {
  const abilityMod = getHighestLinkedAbility(linkedAbilities, abilities);
  const unprofBonus = (a: number) => (a < 0 ? a * 2 : Math.ceil(a / 2));

  if (!baseSkillProficient) {
    return unprofBonus(abilityMod) + baseSkillValue;
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
 * @param skills - Character: Record<id, { prof, val }>; Draft: Record<id, value (number)>
 * @param codexSkills - Full codex skills to resolve base/sub and ability
 * @returns { bonus, proficient } - bonus is the effective skill bonus; proficient is whether they meet the base proficiency requirement
 */
export function getSkillBonusForFeatRequirement(
  skillId: string,
  abilities: Partial<Abilities> | Abilities,
  skills: Record<string, number | { prof?: boolean; val?: number }>,
  codexSkills: CodexSkillForFeat[]
): { bonus: number; proficient: boolean } {
  // Look up by ID first, then fall back to name match (feat data may use either)
  const codexSkill = codexSkills.find((s) => String(s.id) === String(skillId))
    || codexSkills.find((s) => s.name != null && s.name.toLowerCase() === String(skillId).toLowerCase());
  if (!codexSkill) return { bonus: 0, proficient: false };

  const getVal = (key: string): number => {
    const s = skills[key];
    if (s == null) return 0;
    return typeof s === 'number' ? s : (s?.val ?? 0);
  };
  const getProf = (key: string): boolean => {
    const s = skills[key];
    if (s == null) return false;
    return typeof s === 'number' ? s >= 1 : (s?.prof ?? false);
  };

  // Resolve key: character may key by id or by name
  const byId = skills[String(skillId)] != null;
  const byName = codexSkill.name && skills[String(codexSkill.name)] != null;
  const skillKey = byId ? String(skillId) : byName ? String(codexSkill.name) : String(skillId);
  const value = getVal(skillKey) || getVal(String(skillId)) || (codexSkill.name ? getVal(String(codexSkill.name)) : 0);
  const proficient = getProf(skillKey) || getProf(String(skillId)) || (codexSkill.name ? getProf(String(codexSkill.name)) : false);

  const abilityKey = (codexSkill.ability?.split(',')[0]?.trim()?.toLowerCase() || 'strength') as keyof Abilities;
  const abilityMod = abilities[abilityKey] ?? 0;
  const unprofBonus = (a: number) => (a < 0 ? a * 2 : Math.ceil(a / 2));

  const baseSkillId = codexSkill.base_skill_id != null ? String(codexSkill.base_skill_id) : undefined;
  if (baseSkillId) {
    // Sub-skill: need base skill value and proficiency
    const baseCodex = codexSkills.find((s) => String(s.id) === baseSkillId);
    const baseKeyById = skills[baseSkillId] != null;
    const baseKeyByName = baseCodex?.name && skills[String(baseCodex.name)] != null;
    const baseKey = baseKeyById ? baseSkillId : baseKeyByName ? String(baseCodex!.name) : baseSkillId;
    const baseValue = getVal(baseKey) || getVal(baseSkillId) || (baseCodex?.name ? getVal(String(baseCodex.name)) : 0);
    const baseProficient = getProf(baseKey) || getProf(baseSkillId) || (baseCodex?.name ? getProf(String(baseCodex.name)) : false);
    if (!baseProficient) {
      return { bonus: unprofBonus(abilityMod) + baseValue, proficient: false };
    }
    const bonus = abilityMod + baseValue + value;
    return { bonus, proficient: proficient && value >= 1 };
  }

  // Base skill
  if (!proficient) {
    return { bonus: unprofBonus(abilityMod), proficient: false };
  }
  return { bonus: abilityMod + value, proficient: true };
}
