/**
 * Character Calculations — SINGLE SOURCE OF TRUTH
 * =================================================
 * All combat and derived stat calculations for characters AND creatures.
 * Every formula lives here. No other file should inline health/energy/defense/
 * speed/evasion/critical-range calculations.
 *
 * All functions accept an optional `rules` parameter (from useGameRules()).
 * When provided, DB-stored values are used. Otherwise, constants.ts fallbacks apply.
 *
 * Ported from public/js/character-sheet/calculations.js
 */

import type {
  Abilities,
  DefenseBonuses,
  DefenseSkills,
  Character,
  AbilityName,
  Item,
} from '@/types';
import type { CoreRulesMap } from '@/types/core-rules';
import { DEFAULT_DEFENSE_SKILLS } from '@/types/skills';
import {
  resolveDefenseVals,
  resolveMartProf,
  resolvePowProf,
} from '@/lib/character/schema-normalize';
import { COMBAT_DEFAULTS, PLAYER_CONSTANTS } from './constants';
import { unproficientBonus } from './formulas';

type Rules = Partial<CoreRulesMap>;

// =============================================================================
// Defense Calculations
// =============================================================================

/**
 * Calculate defense scores from abilities and defense skill bonuses.
 */
export function calculateDefenses(
  abilities: Partial<Abilities>,
  defenseVals: Partial<DefenseSkills>,
  rules?: Rules,
): { defenseBonuses: DefenseBonuses; defenseScores: Record<string, number> } {
  const a = abilities || {};
  const d = defenseVals || {};
  const baseDefense = rules?.COMBAT?.baseDefense ?? COMBAT_DEFAULTS.BASE_DEFENSE;

  const defenseBonuses: DefenseBonuses = {
    might: (a.strength || 0) + (d.might || 0),
    fortitude: (a.vitality || 0) + (d.fortitude || 0),
    reflex: (a.agility || 0) + (d.reflex || 0),
    discernment: (a.acuity || 0) + (d.discernment || 0),
    mentalFortitude: (a.intelligence || 0) + (d.mentalFortitude || 0),
    resolve: (a.charisma || 0) + (d.resolve || 0),
  };

  const defenseScores: Record<string, number> = {
    might: baseDefense + defenseBonuses.might,
    fortitude: baseDefense + defenseBonuses.fortitude,
    reflex: baseDefense + defenseBonuses.reflex,
    discernment: baseDefense + defenseBonuses.discernment,
    mentalFortitude: baseDefense + defenseBonuses.mentalFortitude,
    resolve: baseDefense + defenseBonuses.resolve,
  };

  return { defenseBonuses, defenseScores };
}

/** Ability-derived Defense Bonus only (no skill-point allocation). */
export function abilityDefenseBonusesFromAbilities(
  abilities: Partial<Abilities>,
): Partial<Record<keyof DefenseSkills, number>> {
  return calculateDefenses(abilities, {}).defenseBonuses;
}

// =============================================================================
// Combat Stats
// =============================================================================

/**
 * Calculate speed from agility.
 * Speed = speedBase + (agility / 2) rounded up
 */
export function calculateSpeed(agility: number, speedBase?: number, rules?: Rules): number {
  const base = speedBase ?? rules?.COMBAT?.baseSpeed ?? COMBAT_DEFAULTS.BASE_SPEED;
  return base + Math.ceil(agility / 2);
}

/**
 * Creature Speed uses the player Speed formula. Size does not add a modifier
 * (GAME_RULES "Size & Carrying Capacity").
 */
export function calculateCreatureSpeed(agility: number, rules?: Rules): number {
  return calculateSpeed(agility, undefined, rules);
}

/** Score = 10 + Bonus (GAME_RULES "The Score Pattern") — Defense Score, Martial/Power Potency. */
export function calculateScoreFromBonus(bonus: number, rules?: Rules): number {
  return (rules?.COMBAT?.baseDefense ?? COMBAT_DEFAULTS.BASE_SCORE) + bonus;
}

/**
 * Calculate evasion from agility.
 * Evasion = evasionBase + agility
 */
export function calculateEvasion(agility: number, evasionBase?: number, rules?: Rules): number {
  const base = evasionBase ?? rules?.COMBAT?.baseEvasion ?? COMBAT_DEFAULTS.BASE_EVASION;
  return base + agility;
}

/**
 * Critical Range threshold = Evasion + critical-hit over-target (+10) + armor increase.
 * Armor **Critical Range +1** contributes **1 + Option 1 level** (GAME_RULES Critical Hits).
 */
export function calculateCriticalRange(
  evasion: number,
  criticalRangeIncrease = 0,
  rules?: Rules,
): number {
  const over = rules?.COMBAT?.criticalHitThreshold ?? COMBAT_DEFAULTS.CRITICAL_RANGE_OVER_TARGET;
  return evasion + over + criticalRangeIncrease;
}

/**
 * Calculate max health from allocated points and abilities.
 */
export function calculateMaxHealth(
  healthPoints: number,
  vitality: number,
  level: number,
  powAbil: AbilityName | string | undefined,
  abilities: Partial<Abilities>,
  rules?: Rules,
  martAbil?: AbilityName | string | undefined,
): number {
  const baseHealth = rules?.PROGRESSION_PLAYER?.baseHealth ?? PLAYER_CONSTANTS.BASE_HEALTH;
  const vitalityIsArchetype =
    powAbil?.toLowerCase() === 'vitality' || martAbil?.toLowerCase() === 'vitality';
  const abilityMod = vitalityIsArchetype ? abilities?.strength || 0 : vitality;

  const raw =
    abilityMod < 0
      ? baseHealth + abilityMod + healthPoints
      : baseHealth + abilityMod * level + healthPoints;
  return Math.max(0, raw);
}

/**
 * Calculate max energy from allocated points and a single Archetype Ability name.
 * Prefer `calculateMaxEnergyForArchetype` when both Power and Martial names are known.
 */
export function calculateMaxEnergy(
  energyPoints: number,
  archetypeAbility: AbilityName | string | undefined,
  abilities: Partial<Abilities>,
  level: number,
): number {
  const abilityMod = abilities?.[archetypeAbility?.toLowerCase() as keyof Abilities] || 0;
  return Math.max(0, abilityMod * level + energyPoints);
}

/**
 * Archetype Ability used for Energy: the higher of the Power and Martial Archetype
 * Abilities (GAME_RULES "Archetype Ability" / "Health & Energy Allocation" — a
 * Powered-Martial path has two, and neither is secondary).
 */
export function resolveEnergyArchetypeAbility(
  abilities: Partial<Abilities>,
  powAbil: AbilityName | string | undefined,
  martAbil: AbilityName | string | undefined,
): AbilityName | string | undefined {
  if (!powAbil) return martAbil;
  if (!martAbil) return powAbil;
  const powVal = abilities?.[powAbil.toLowerCase() as keyof Abilities] ?? 0;
  const martVal = abilities?.[martAbil.toLowerCase() as keyof Abilities] ?? 0;
  return martVal > powVal ? martAbil : powAbil;
}

/** Max Energy using the higher of pow/mart Archetype Abilities. */
export function calculateMaxEnergyForArchetype(
  energyPoints: number,
  abilities: Partial<Abilities>,
  level: number,
  powAbil: AbilityName | string | undefined,
  martAbil: AbilityName | string | undefined,
): number {
  return calculateMaxEnergy(
    energyPoints,
    resolveEnergyArchetypeAbility(abilities, powAbil, martAbil),
    abilities,
    level,
  );
}

/**
 * Get the archetype ability score for a character.
 */
export function getArchetypeAbilityScore(charData: Partial<Character>): number {
  if (!charData?.abilities) return 0;

  const powAbil = charData.pow_abil || charData.archetype?.pow_abil || charData.archetype?.ability;
  const martAbil = charData.mart_abil || charData.archetype?.mart_abil;

  let powVal = 0;
  let martVal = 0;

  if (powAbil) {
    powVal = charData.abilities[powAbil.toLowerCase() as keyof Abilities] || 0;
  }
  if (martAbil) {
    martVal = charData.abilities[martAbil.toLowerCase() as keyof Abilities] || 0;
  }

  return Math.max(powVal, martVal);
}

// =============================================================================
// Attack Bonuses
// =============================================================================

interface AttackBonuses {
  martial: number;
  power: number;
  strength: { prof: number; unprof: number };
  agility: { prof: number; unprof: number };
  acuity: { prof: number; unprof: number };
  powerAttack: { prof: number; unprof: number };
}

/**
 * Calculate attack bonuses from proficiency and abilities.
 */
export function calculateBonuses(
  martProf: number,
  powProf: number,
  abilities: Partial<Abilities>,
  powAbil?: AbilityName | string,
): AttackBonuses {
  const mart = martProf || 0;
  const pow = powProf || 0;

  const powerAbilityValue = powAbil
    ? abilities?.[powAbil.toLowerCase() as keyof Abilities] || 0
    : abilities?.charisma || 0;

  return {
    martial: mart,
    power: pow,
    strength: {
      prof: mart + (abilities?.strength || 0),
      unprof: unproficientBonus(abilities?.strength || 0),
    },
    agility: {
      prof: mart + (abilities?.agility || 0),
      unprof: unproficientBonus(abilities?.agility || 0),
    },
    acuity: {
      prof: mart + (abilities?.acuity || 0),
      unprof: unproficientBonus(abilities?.acuity || 0),
    },
    powerAttack: {
      prof: pow + powerAbilityValue,
      unprof: unproficientBonus(powerAbilityValue),
    },
  };
}

/** Power Attack Bonus = Power Ability + Power Proficiency (GAME_RULES). */
export function calculatePowerAttackBonus(charData: Partial<Character>): number {
  const abilities = charData.abilities ?? {};
  const record = charData as Record<string, unknown>;
  const powProf = resolvePowProf(record) ?? 0;
  const martProf = resolveMartProf(record) ?? 0;
  const powAbil = charData.pow_abil ?? charData.archetype?.pow_abil ?? charData.archetype?.ability;
  return calculateBonuses(martProf, powProf, abilities, powAbil).powerAttack.prof;
}

// =============================================================================
// Terminal Threshold
// =============================================================================

/**
 * Calculate terminal threshold (1/4 max health, rounded up).
 */
export function calculateTerminal(maxHealth: number): number {
  return Math.ceil(maxHealth / 4);
}

// =============================================================================
// Master Stats Function
// =============================================================================

export interface AllDerivedStats {
  maxHealth: number;
  maxEnergy: number;
  terminal: number;
  speed: number;
  evasion: number;
  armor: number;
  defenseBonuses: Record<string, number>;
  defenseScores: Record<string, number>;
}

/**
 * Calculate ALL derived stats for a character in one call.
 * This is the single source of truth.
 */
export function calculateAllStats(character: Partial<Character>, rules?: Rules): AllDerivedStats {
  const abilities = character.abilities || {
    strength: 0,
    vitality: 0,
    agility: 0,
    acuity: 0,
    intelligence: 0,
    charisma: 0,
  };

  const defenseVals: DefenseSkills = {
    ...DEFAULT_DEFENSE_SKILLS,
    ...(resolveDefenseVals(character as Record<string, unknown>) || {}),
  };

  // --- Defenses ---
  const { defenseBonuses, defenseScores } = calculateDefenses(abilities, defenseVals, rules);

  // --- Speed & Evasion ---
  const speedBase = character.speedBase ?? rules?.COMBAT?.baseSpeed ?? COMBAT_DEFAULTS.BASE_SPEED;
  const speed = calculateSpeed(abilities.agility || 0, speedBase, rules);

  const evasionBase =
    character.evasionBase ?? rules?.COMBAT?.baseEvasion ?? COMBAT_DEFAULTS.BASE_EVASION;
  const evasion = calculateEvasion(abilities.agility || 0, evasionBase, rules);

  // --- Armor ---
  const armorItems = (character.equipment?.armor || []) as Item[];
  const armor = armorItems
    .filter((item) => item.equipped)
    .reduce((sum, item) => sum + (item.armor || 0), 0);

  // --- Health & Energy ---
  const level = character.level || 1;
  const healthPoints = character.healthPoints || 0;
  const energyPoints = character.energyPoints || 0;

  const archetype = character.archetype;
  const powAbil = character.pow_abil || archetype?.pow_abil || archetype?.ability;
  const martAbil = character.mart_abil || archetype?.mart_abil;

  const maxHealth = calculateMaxHealth(
    healthPoints,
    abilities.vitality || 0,
    level,
    powAbil,
    abilities,
    rules,
    martAbil,
  );
  const maxEnergy = calculateMaxEnergyForArchetype(
    energyPoints,
    abilities,
    level,
    powAbil,
    martAbil,
  );

  const terminal = calculateTerminal(maxHealth);

  return {
    maxHealth,
    maxEnergy,
    terminal,
    speed,
    evasion,
    armor,
    defenseBonuses: { ...defenseBonuses },
    defenseScores: { ...defenseScores },
  };
}

/**
 * Compute max health and max energy from raw character data.
 */
export function computeMaxHealthEnergy(
  charData: Character | Record<string, unknown>,
  rules?: Rules,
): {
  maxHealth: number;
  maxEnergy: number;
} {
  const record = charData as Record<string, unknown>;
  const rawAbilities = (record.abilities || {}) as Record<string, number>;
  const abilities: Partial<Abilities> = {
    ...rawAbilities,
    acuity: rawAbilities.acuity ?? rawAbilities.acu ?? 0,
    agility: rawAbilities.agility ?? rawAbilities.agi ?? 0,
  };
  const level = (record.level as number) ?? 1;
  const healthPoints = (record.healthPoints as number) ?? 0;
  const energyPoints = (record.energyPoints as number) ?? 0;
  const archetype = record.archetype as
    | { type?: string; pow_abil?: string; mart_abil?: string; ability?: string }
    | undefined;
  // Match calculateAllStats: top-level pow_abil / archetype.pow_abil / archetype.ability
  const powAbil = (record.pow_abil as string) || archetype?.pow_abil || archetype?.ability;
  const martAbil = (record.mart_abil as string) || archetype?.mart_abil;

  const maxHealth = calculateMaxHealth(
    healthPoints,
    abilities.vitality || 0,
    level,
    powAbil,
    abilities,
    rules,
    martAbil,
  );
  const maxEnergy = calculateMaxEnergyForArchetype(
    energyPoints,
    abilities,
    level,
    powAbil,
    martAbil,
  );

  return { maxHealth, maxEnergy };
}
