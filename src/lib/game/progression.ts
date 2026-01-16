/**
 * Level Progression
 * ==================
 * Get complete progression data for characters and creatures
 */

import type { EntityType } from '@/types';
import {
  calculateAbilityPoints,
  calculateSkillPoints,
  calculateHealthEnergyPool,
  calculateTrainingPoints,
  calculateCreatureTrainingPoints,
  calculateProficiency,
  calculateMaxArchetypeFeats,
  calculateMaxCharacterFeats,
  calculateCreatureCurrency,
} from './formulas';

/** Player character progression data */
export interface PlayerProgression {
  level: number;
  abilityPoints: number;
  skillPoints: number;
  healthEnergyPool: number;
  trainingPoints: number;
  proficiency: number;
  maxArchetypeFeats: number;
  maxCharacterFeats: number;
}

/** Creature progression data */
export interface CreatureProgression {
  level: number;
  abilityPoints: number;
  skillPoints: number;
  healthEnergyPool: number;
  trainingPoints: number;
  proficiency: number;
  currency: number;
}

/** Level difference for level-up displays */
export interface LevelDifference {
  abilityPoints: number;
  skillPoints: number;
  healthEnergyPool: number;
  trainingPoints: number;
  proficiency: number;
}

/**
 * Get all level progression data for a player character.
 */
export function getPlayerProgression(level: number, highestArchetypeAbility = 0): PlayerProgression {
  return {
    level,
    abilityPoints: calculateAbilityPoints(level),
    skillPoints: calculateSkillPoints(level),
    healthEnergyPool: calculateHealthEnergyPool(level, 'PLAYER'),
    trainingPoints: calculateTrainingPoints(level, highestArchetypeAbility),
    proficiency: calculateProficiency(level),
    maxArchetypeFeats: calculateMaxArchetypeFeats(level),
    maxCharacterFeats: calculateMaxCharacterFeats(level),
  };
}

/**
 * Get all level progression data for a creature.
 */
export function getCreatureProgression(level: number, highestNonVitality = 0): CreatureProgression {
  return {
    level,
    abilityPoints: calculateAbilityPoints(level, true),
    skillPoints: calculateSkillPoints(level, true),
    healthEnergyPool: calculateHealthEnergyPool(level, 'CREATURE', true),
    trainingPoints: calculateCreatureTrainingPoints(level, highestNonVitality),
    proficiency: calculateProficiency(level, true),
    currency: calculateCreatureCurrency(level),
  };
}

/**
 * Calculate the difference in resources between two levels.
 */
export function getLevelDifference(
  fromLevel: number,
  toLevel: number,
  highestAbility = 0,
  entityType: EntityType = 'PLAYER'
): LevelDifference {
  const isCreature = entityType === 'CREATURE';
  const allowSubLevel = isCreature;
  
  const from = {
    abilityPoints: calculateAbilityPoints(fromLevel, allowSubLevel),
    skillPoints: calculateSkillPoints(fromLevel, allowSubLevel),
    healthEnergyPool: calculateHealthEnergyPool(fromLevel, entityType, allowSubLevel),
    trainingPoints: isCreature 
      ? calculateCreatureTrainingPoints(fromLevel, highestAbility)
      : calculateTrainingPoints(fromLevel, highestAbility),
    proficiency: calculateProficiency(fromLevel, allowSubLevel),
  };
  
  const to = {
    abilityPoints: calculateAbilityPoints(toLevel, allowSubLevel),
    skillPoints: calculateSkillPoints(toLevel, allowSubLevel),
    healthEnergyPool: calculateHealthEnergyPool(toLevel, entityType, allowSubLevel),
    trainingPoints: isCreature 
      ? calculateCreatureTrainingPoints(toLevel, highestAbility)
      : calculateTrainingPoints(toLevel, highestAbility),
    proficiency: calculateProficiency(toLevel, allowSubLevel),
  };
  
  return {
    abilityPoints: to.abilityPoints - from.abilityPoints,
    skillPoints: to.skillPoints - from.skillPoints,
    healthEnergyPool: to.healthEnergyPool - from.healthEnergyPool,
    trainingPoints: to.trainingPoints - from.trainingPoints,
    proficiency: to.proficiency - from.proficiency,
  };
}
