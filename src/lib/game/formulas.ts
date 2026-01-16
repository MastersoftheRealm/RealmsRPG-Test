/**
 * Game Formulas
 * ==============
 * Centralized game calculation formulas for RealmsRPG
 * Ported from public/js/shared/game-formulas.js
 */

import type { EntityType, Abilities, Defenses, DefenseBonuses, ArchetypeCategory, Character } from '@/types';
import { 
  SHARED_CONSTANTS, 
  PLAYER_CONSTANTS, 
  CREATURE_CONSTANTS, 
  ABILITY_LIMITS,
  ARCHETYPE_CONFIGS,
  COMBAT_DEFAULTS,
} from './constants';

// =============================================================================
// Level Progression Calculations
// =============================================================================

/**
 * Calculate ability points based on level.
 * Formula: 7 at level 1, +1 every 3 levels starting at level 3
 */
export function calculateAbilityPoints(level: number, allowSubLevel = false): number {
  const parsedLevel = parseFloat(String(level)) || 1;
  
  if (allowSubLevel && parsedLevel < 1) {
    return Math.ceil(SHARED_CONSTANTS.BASE_ABILITY_POINTS * parsedLevel);
  }
  
  if (parsedLevel < 1) return 0;
  if (parsedLevel < 3) return SHARED_CONSTANTS.BASE_ABILITY_POINTS;
  
  const bonusPoints = Math.floor((parsedLevel - 1) / 3) * SHARED_CONSTANTS.ABILITY_POINTS_PER_3_LEVELS;
  return SHARED_CONSTANTS.BASE_ABILITY_POINTS + bonusPoints;
}

/**
 * Calculate skill points based on level.
 * Formula: 2 + level * 3
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
 * Calculate health-energy pool based on level.
 */
export function calculateHealthEnergyPool(
  level: number, 
  entityType: EntityType = 'PLAYER', 
  allowSubLevel = false
): number {
  const parsedLevel = parseFloat(String(level)) || 1;
  const config = entityType === 'CREATURE' ? CREATURE_CONSTANTS : PLAYER_CONSTANTS;
  
  if (allowSubLevel && parsedLevel < 1) {
    return Math.ceil(config.BASE_HIT_ENERGY * parsedLevel);
  }
  
  return config.BASE_HIT_ENERGY + (SHARED_CONSTANTS.HIT_ENERGY_PER_LEVEL * (parsedLevel - 1));
}

/**
 * Calculate proficiency points based on level.
 * Formula: 2 + 1 every 5 levels starting at level 5
 */
export function calculateProficiency(level: number, allowSubLevel = false): number {
  const parsedLevel = parseFloat(String(level)) || 1;
  
  if (allowSubLevel && parsedLevel < 1) {
    return Math.ceil(SHARED_CONSTANTS.BASE_PROFICIENCY * parsedLevel);
  }
  
  if (parsedLevel < 1) return 0;
  if (parsedLevel < 5) return SHARED_CONSTANTS.BASE_PROFICIENCY;
  
  const bonusPoints = Math.floor(parsedLevel / 5) * SHARED_CONSTANTS.PROFICIENCY_PER_5_LEVELS;
  return SHARED_CONSTANTS.BASE_PROFICIENCY + bonusPoints;
}

/**
 * Calculate training points for a player character.
 * Formula: 22 + ability + ((2 + ability) * (level - 1))
 */
export function calculateTrainingPoints(level: number, highestArchetypeAbility = 0): number {
  const ability = highestArchetypeAbility || 0;
  const base = PLAYER_CONSTANTS.BASE_TRAINING_POINTS;
  const perLevel = PLAYER_CONSTANTS.TP_PER_LEVEL_MULTIPLIER + ability;
  
  return base + ability + (perLevel * (level - 1));
}

/**
 * Calculate training points for a creature.
 * Formula: 9 + ability + (level - 1) * (1 + ability)
 */
export function calculateCreatureTrainingPoints(level: number, highestNonVitality = 0): number {
  const parsedLevel = parseFloat(String(level)) || 1;
  const ability = highestNonVitality || 0;
  
  if (parsedLevel < 1) {
    return Math.ceil(22 * parsedLevel) + ability;
  }
  
  const base = CREATURE_CONSTANTS.BASE_TRAINING_POINTS;
  const perLevel = CREATURE_CONSTANTS.TP_PER_LEVEL + ability;
  
  if (parsedLevel <= 1) return base + ability;
  return base + ability + ((parsedLevel - 1) * perLevel);
}

/**
 * Calculate creature feat points based on level and martial proficiency.
 * Base Formula at level 1: 1.5 + martial proficiency
 * Additional levels: +1 per level after level 1
 * For sub-levels: ceil((1.5 + martial) * level)
 */
export function calculateCreatureFeatPoints(level: number, martialProficiency = 0): number {
  const parsedLevel = parseFloat(String(level)) || 1;
  const martial = martialProficiency || 0;
  
  if (parsedLevel < 1) {
    // Fractional levels: (1.5 + martial) * level, rounded up
    return Math.ceil((1.5 + martial) * parsedLevel);
  }
  
  // Base feat points at level 1: 1.5 + martial proficiency
  const baseAtLevel1 = 1.5 + martial;
  
  // Add 1 per level after level 1
  const levelBonus = parsedLevel > 1 ? (parsedLevel - 1) : 0;
  
  return baseAtLevel1 + levelBonus;
}

/**
 * Calculate creature currency based on level.
 * Formula: 200 * 1.45^(level-1)
 */
export function calculateCreatureCurrency(level: number): number {
  const parsedLevel = parseFloat(String(level)) || 1;
  return Math.round(
    CREATURE_CONSTANTS.BASE_CURRENCY * 
    Math.pow(CREATURE_CONSTANTS.CURRENCY_GROWTH, parsedLevel - 1)
  );
}

/**
 * Calculate maximum archetype feats allowed based on level.
 */
export function calculateMaxArchetypeFeats(level: number): number {
  return Math.max(0, Math.floor(level));
}

/**
 * Calculate maximum character feats allowed based on level.
 */
export function calculateMaxCharacterFeats(level: number): number {
  return Math.max(0, Math.floor(level));
}

// =============================================================================
// Ability Score Helpers
// =============================================================================

/**
 * Get the cost to increase an ability score.
 */
export function getAbilityIncreaseCost(currentValue: number): number {
  if (currentValue >= ABILITY_LIMITS.COST_INCREASE_THRESHOLD) {
    return 2;
  }
  return 1;
}

/**
 * Check if an ability increase is valid.
 */
export function canIncreaseAbility(
  currentValue: number, 
  availablePoints: number, 
  isCreation = true
): boolean {
  const max = isCreation ? ABILITY_LIMITS.MAX_STARTING : ABILITY_LIMITS.MAX_ABSOLUTE;
  if (currentValue >= max) return false;
  
  const cost = getAbilityIncreaseCost(currentValue);
  return availablePoints >= cost;
}

/**
 * Check if an ability decrease is valid.
 */
export function canDecreaseAbility(currentValue: number): boolean {
  return currentValue > ABILITY_LIMITS.MIN;
}

// =============================================================================
// Archetype Helpers
// =============================================================================

/**
 * Get archetype configuration.
 */
export function getArchetypeConfig(archetypeType: ArchetypeCategory | string) {
  return ARCHETYPE_CONFIGS[archetypeType as ArchetypeCategory] || ARCHETYPE_CONFIGS.power;
}

/**
 * Get the maximum armament value for an archetype.
 */
export function getArmamentMax(archetype: ArchetypeCategory | { type?: ArchetypeCategory }): number {
  const type = typeof archetype === 'string' ? archetype : archetype?.type;
  return getArchetypeConfig(type || 'power').armamentMax;
}

/**
 * Get the archetype feat limit.
 */
export function getArchetypeFeatLimit(archetype: ArchetypeCategory | { type?: ArchetypeCategory }): number {
  const type = typeof archetype === 'string' ? archetype : archetype?.type;
  return getArchetypeConfig(type || 'power').featLimit;
}

/**
 * Get the maximum innate energy for an archetype.
 */
export function getInnateEnergyMax(archetype: ArchetypeCategory | { type?: ArchetypeCategory }): number {
  const type = typeof archetype === 'string' ? archetype : archetype?.type;
  return getArchetypeConfig(type || 'power').innateEnergy;
}

/**
 * Get the archetype ability score (the highest ability linked to archetype abilities).
 * For powered-martial: max of power and martial ability scores
 * For power/martial: the single archetype ability score
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
  
  // For power or martial, use pow_abil or mart_abil (whichever is set)
  const abilityKey = (archetype.pow_abil || archetype.mart_abil)?.toLowerCase() as keyof Abilities;
  return abilityKey ? (abilities[abilityKey] || 0) : 0;
}

/**
 * Get base health for a character.
 * Formula: 8 + vitality (or strength if vitality is archetype ability)
 */
export function getBaseHealth(
  archetype: { type?: string; pow_abil?: string; mart_abil?: string } | undefined,
  abilities: Partial<Abilities>
): number {
  const vitality = abilities.vitality || 0;
  
  // If vitality is an archetype ability, use strength instead
  const isVitalityArchetype = 
    archetype?.pow_abil?.toLowerCase() === 'vitality' ||
    archetype?.mart_abil?.toLowerCase() === 'vitality';
  
  if (isVitalityArchetype) {
    return 8 + (abilities.strength || 0);
  }
  
  return 8 + vitality;
}

/**
 * Get base energy for a character.
 * Formula: 0 + archetype ability score
 */
export function getBaseEnergy(
  archetype: { type?: string; pow_abil?: string; mart_abil?: string } | undefined,
  abilities: Partial<Abilities>
): number {
  return getArchetypeAbility(archetype, abilities);
}

// =============================================================================
// Skill Helpers
// =============================================================================

/** 
 * Ability name to abilities object key mapping 
 */
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
 * Skills can have multiple linked abilities, and we use the highest.
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
 * This formula is used across creature creator and character sheet.
 * 
 * @param linkedAbilities - The ability/abilities linked to this skill (from skill.ability)
 * @param skillValue - The points allocated to this skill
 * @param abilities - The character/creature's ability scores
 * @returns The total skill bonus
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
 * Used in character sheet where proficiency adds +1.
 * 
 * @param linkedAbilities - The ability/abilities linked to this skill
 * @param skillValue - The points allocated to this skill  
 * @param abilities - The character/creature's ability scores
 * @param isProficient - Whether the character is proficient in this skill
 * @returns The total skill bonus including proficiency
 */
export function calculateSkillBonusWithProficiency(
  linkedAbilities: string | string[] | undefined,
  skillValue: number,
  abilities: Abilities,
  isProficient: boolean = false
): number {
  const abilityMod = getHighestLinkedAbility(linkedAbilities, abilities);
  
  if (isProficient) {
    // Proficient: ability + skill value + 1
    return abilityMod + skillValue + 1;
  } else {
    // Unproficient: half ability (rounded up) or double negative
    const unprofAbilityBonus = abilityMod < 0 ? abilityMod * 2 : Math.ceil(abilityMod / 2);
    return unprofAbilityBonus;
  }
}
