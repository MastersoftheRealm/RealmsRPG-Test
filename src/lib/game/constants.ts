/**
 * Game Constants
 * ===============
 * Centralized game constants for RealmsRPG
 * Ported from public/js/shared/game-formulas.js
 */

import type { ArchetypeCategory, ArchetypeConfig } from '@/types';

/** Shared constants for characters and creatures */
export const SHARED_CONSTANTS = {
  BASE_ABILITY_POINTS: 7,
  ABILITY_POINTS_PER_3_LEVELS: 1,
  BASE_SKILL_POINTS: 2,
  SKILL_POINTS_PER_LEVEL: 3,
  BASE_PROFICIENCY: 2,
  PROFICIENCY_PER_5_LEVELS: 1,
  HIT_ENERGY_PER_LEVEL: 12,
} as const;

/** Player character specific constants */
export const PLAYER_CONSTANTS = {
  BASE_HIT_ENERGY: 18,
  BASE_TRAINING_POINTS: 22,
  TP_PER_LEVEL_MULTIPLIER: 2,
} as const;

/** Creature/NPC specific constants */
export const CREATURE_CONSTANTS = {
  BASE_HIT_ENERGY: 26,
  BASE_TRAINING_POINTS: 9,
  TP_PER_LEVEL: 1,
  BASE_FEAT_POINTS: 4,
  FEAT_POINTS_PER_LEVEL: 1,
  BASE_CURRENCY: 200,
  CURRENCY_GROWTH: 1.45,
} as const;

/** Ability score limits */
export const ABILITY_LIMITS = {
  MIN: -2,
  MAX_STARTING: 3,
  MAX_ABSOLUTE: 6,
  COST_INCREASE_THRESHOLD: 4,
} as const;

/** Skill limits */
export const SKILL_LIMITS = {
  MAX_PER_SKILL: 3,
  DEFENSE_MAX: 3,
} as const;

/** Archetype configurations */
export const ARCHETYPE_CONFIGS: Record<ArchetypeCategory, ArchetypeConfig> = {
  power: {
    featLimit: 1,
    armamentMax: 4,
    innateEnergy: 8,
    proficiency: { martial: 0, power: 2 },
    trainingPointBonus: 0,
  },
  'powered-martial': {
    featLimit: 2,
    armamentMax: 8,
    innateEnergy: 6,
    proficiency: { martial: 1, power: 1 },
    trainingPointBonus: 0,
  },
  martial: {
    featLimit: 3,
    armamentMax: 16,
    innateEnergy: 0,
    proficiency: { martial: 2, power: 0 },
    trainingPointBonus: 0,
  },
} as const;

/** All game constants grouped */
export const GAME_CONSTANTS = {
  SHARED: SHARED_CONSTANTS,
  PLAYER: PLAYER_CONSTANTS,
  CREATURE: CREATURE_CONSTANTS,
  ABILITY: ABILITY_LIMITS,
  SKILL: SKILL_LIMITS,
  ARCHETYPE: ARCHETYPE_CONFIGS,
} as const;

/** Default combat values */
export const COMBAT_DEFAULTS = {
  BASE_SPEED: 6,
  BASE_EVASION: 10,
  BASE_DEFENSE: 10,
} as const;
