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
  BASE_TRAINING_POINTS: 22,
  TP_PER_LEVEL: 2,
  BASE_SKILL_POINTS: 5,
  SKILL_POINTS_PER_LEVEL: 3,
  BASE_FEAT_POINTS: 4,
  FEAT_POINTS_PER_LEVEL: 1,
  BASE_CURRENCY: 200,
  CURRENCY_GROWTH: 1.45,
} as const;

/** Ability score limits */
export const ABILITY_LIMITS = {
  MIN: -2,
  MAX_STARTING: 3,
  /** Hard cap for player characters (no level-based cap; cost doubling at 4+ is the soft cap) */
  MAX_ABSOLUTE: 10,
  /** Hard cap for creatures/NPCs */
  MAX_ABSOLUTE_CREATURE: 20,
  /** Abilities cost 2 per point at this value and above (4→5 costs 2, 3→4 costs 1) */
  COST_INCREASE_THRESHOLD: 4,
} as const;

/** Skill limits */
export const SKILL_LIMITS = {
  MAX_PER_SKILL: 3,
  DEFENSE_MAX: 3,
} as const;

/** Archetype configurations (level 1 starting values) */
export const ARCHETYPE_CONFIGS: Record<ArchetypeCategory, ArchetypeConfig> = {
  power: {
    featLimit: 0,           // No bonus archetype feats (total = level)
    armamentMax: 3,         // Martial Prof 0 → Armament Prof 3
    innateEnergy: 8,        // Innate Threshold 8
    innateThreshold: 8,
    innatePools: 2,
    proficiency: { martial: 0, power: 2 },
    trainingPointBonus: 0,
  },
  'powered-martial': {
    featLimit: 1,           // +1 bonus from martial proficiency joining
    armamentMax: 8,         // Martial Prof 1 → Armament Prof 8
    innateEnergy: 6,        // Innate Threshold 6
    innateThreshold: 6,
    innatePools: 1,
    proficiency: { martial: 1, power: 1 },
    trainingPointBonus: 0,
  },
  martial: {
    featLimit: 2,           // +2 bonus archetype feats at level 1
    armamentMax: 12,        // Martial Prof 2 → Armament Prof 12
    innateEnergy: 0,
    innateThreshold: 0,
    innatePools: 0,
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

/** Six Abilities + Six Defenses for feat requirements and sorting. Display names per GAME_RULES. */
export const ABILITIES_AND_DEFENSES = [
  'Strength',
  'Vitality',
  'Agility',
  'Acuity',
  'Intelligence',
  'Charisma',
  'Might',
  'Fortitude',
  'Reflexes',
  'Discernment',
  'Mental Fortitude',
  'Resolve',
] as const;
