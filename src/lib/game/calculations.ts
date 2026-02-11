/**
 * Character Calculations — SINGLE SOURCE OF TRUTH
 * =================================================
 * All combat and derived stat calculations for characters AND creatures.
 * Every formula lives here. No other file should inline health/energy/defense/
 * speed/evasion calculations.
 *
 * All functions accept an optional `rules` parameter (from useGameRules()).
 * When provided, DB-stored values are used. Otherwise, constants.ts fallbacks apply.
 *
 * Ported from public/js/character-sheet/calculations.js
 */

import type { Abilities, DefenseBonuses, DefenseSkills, Character, AbilityName, Item } from '@/types';
import type { CoreRulesMap } from '@/types/core-rules';
import { DEFAULT_DEFENSE_SKILLS } from '@/types/skills';
import { COMBAT_DEFAULTS } from './constants';

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
  rules?: Rules
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
 * Calculate evasion from agility.
 * Evasion = evasionBase + agility
 */
export function calculateEvasion(agility: number, evasionBase?: number, rules?: Rules): number {
  const base = evasionBase ?? rules?.COMBAT?.baseEvasion ?? COMBAT_DEFAULTS.BASE_EVASION;
  return base + agility;
}

/**
 * Calculate max health from allocated points and abilities.
 */
export function calculateMaxHealth(
  healthPoints: number,
  vitality: number,
  level: number,
  archetypeAbility: AbilityName | string | undefined,
  abilities: Partial<Abilities>,
  rules?: Rules
): number {
  const baseHealth = rules?.PROGRESSION_PLAYER?.baseHealth ?? 8;
  const useStrength = archetypeAbility?.toLowerCase() === 'vitality';
  const abilityMod = useStrength ? (abilities?.strength || 0) : vitality;
  
  if (abilityMod < 0) {
    return baseHealth + abilityMod + healthPoints;
  } else {
    return baseHealth + (abilityMod * level) + healthPoints;
  }
}

/**
 * Calculate max energy from allocated points and abilities.
 */
export function calculateMaxEnergy(
  energyPoints: number,
  archetypeAbility: AbilityName | string | undefined,
  abilities: Partial<Abilities>,
  level: number
): number {
  const abilityMod = abilities?.[archetypeAbility?.toLowerCase() as keyof Abilities] || 0;
  return (abilityMod * level) + energyPoints;
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
  powAbil?: AbilityName | string
): AttackBonuses {
  const mart = martProf || 0;
  const pow = powProf || 0;
  
  const powerAbilityValue = powAbil 
    ? (abilities?.[powAbil.toLowerCase() as keyof Abilities] || 0) 
    : (abilities?.charisma || 0);
  
  const unprofBonus = (abilityValue: number): number => {
    return abilityValue < 0 ? abilityValue * 2 : Math.ceil(abilityValue / 2);
  };
  
  return {
    martial: mart,
    power: pow,
    strength: {
      prof: mart + (abilities?.strength || 0),
      unprof: unprofBonus(abilities?.strength || 0),
    },
    agility: {
      prof: mart + (abilities?.agility || 0),
      unprof: unprofBonus(abilities?.agility || 0),
    },
    acuity: {
      prof: mart + (abilities?.acuity || 0),
      unprof: unprofBonus(abilities?.acuity || 0),
    },
    powerAttack: {
      prof: pow + powerAbilityValue,
      unprof: unprofBonus(powerAbilityValue),
    },
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the current speed base value.
 */
export function getSpeedBase(charData: Partial<Character>, rules?: Rules): number {
  return charData?.speedBase ?? rules?.COMBAT?.baseSpeed ?? COMBAT_DEFAULTS.BASE_SPEED;
}

/**
 * Get the current evasion base value.
 */
export function getEvasionBase(charData: Partial<Character>, rules?: Rules): number {
  return charData?.evasionBase ?? rules?.COMBAT?.baseEvasion ?? COMBAT_DEFAULTS.BASE_EVASION;
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
    strength: 0, vitality: 0, agility: 0,
    acuity: 0, intelligence: 0, charisma: 0,
  };

  const defenseVals: DefenseSkills = {
    ...DEFAULT_DEFENSE_SKILLS,
    ...(character.defenseSkills || {}),
    ...(character.defenseVals || {}),
  };

  // --- Defenses ---
  const { defenseBonuses, defenseScores } = calculateDefenses(abilities, defenseVals, rules);

  // --- Speed & Evasion ---
  const speedBase = character.speedBase ?? rules?.COMBAT?.baseSpeed ?? COMBAT_DEFAULTS.BASE_SPEED;
  const speed = calculateSpeed(abilities.agility || 0, speedBase, rules);

  const evasionBase = character.evasionBase ?? rules?.COMBAT?.baseEvasion ?? COMBAT_DEFAULTS.BASE_EVASION;
  const evasion = calculateEvasion(abilities.agility || 0, evasionBase, rules);

  // --- Armor ---
  const armorItems = (character.equipment?.armor || []) as Item[];
  const armor = armorItems
    .filter(item => item.equipped)
    .reduce((sum, item) => sum + (item.armor || 0), 0);

  // --- Health & Energy ---
  const level = character.level || 1;
  const healthPoints = character.healthPoints || 0;
  const energyPoints = character.energyPoints || 0;

  const archetype = character.archetype;
  const powAbil = character.pow_abil || archetype?.pow_abil || archetype?.ability;
  const martAbil = character.mart_abil || archetype?.mart_abil;

  const maxHealth = calculateMaxHealth(healthPoints, abilities.vitality || 0, level, powAbil, abilities, rules);
  const maxEnergy = calculateMaxEnergy(energyPoints, powAbil || martAbil, abilities, level);

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
export function computeMaxHealthEnergy(charData: Record<string, unknown>, rules?: Rules): {
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
  const powAbil = archetype?.pow_abil;
  const martAbil = archetype?.mart_abil;

  const maxHealth = calculateMaxHealth(healthPoints, abilities.vitality || 0, level, powAbil, abilities, rules);
  const maxEnergy = calculateMaxEnergy(energyPoints, powAbil || martAbil, abilities, level);

  return { maxHealth, maxEnergy };
}
