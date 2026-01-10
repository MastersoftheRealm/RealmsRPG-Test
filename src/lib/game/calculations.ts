/**
 * Character Calculations
 * =======================
 * Combat and derived stat calculations for characters
 * Ported from public/js/character-sheet/calculations.js
 */

import type { Abilities, Defenses, DefenseBonuses, DefenseSkills, Character, AbilityName } from '@/types';
import { COMBAT_DEFAULTS } from './constants';

// =============================================================================
// Defense Calculations
// =============================================================================

/**
 * Calculate defense scores from abilities and defense skill bonuses.
 */
export function calculateDefenses(
  abilities: Partial<Abilities>,
  defenseVals: Partial<DefenseSkills>
): { defenseBonuses: DefenseBonuses; defenseScores: Defenses } {
  const a = abilities || {};
  const d = defenseVals || {};
  
  const defenseBonuses: DefenseBonuses = {
    might: (a.strength || 0) + (d.might || 0),
    fortitude: (a.vitality || 0) + (d.fortitude || 0),
    reflex: (a.agility || 0) + (d.reflex || 0),
    discernment: (a.acuity || 0) + (d.discernment || 0),
    mentalFortitude: (a.intelligence || 0) + (d.mentalFortitude || 0),
    resolve: (a.charisma || 0) + (d.resolve || 0),
  };
  
  const defenseScores: Defenses = {
    might: COMBAT_DEFAULTS.BASE_DEFENSE + defenseBonuses.might,
    fortitude: COMBAT_DEFAULTS.BASE_DEFENSE + defenseBonuses.fortitude,
    reflex: COMBAT_DEFAULTS.BASE_DEFENSE + defenseBonuses.reflex,
    discernment: COMBAT_DEFAULTS.BASE_DEFENSE + defenseBonuses.discernment,
    mentalFortitude: COMBAT_DEFAULTS.BASE_DEFENSE + defenseBonuses.mentalFortitude,
    resolve: COMBAT_DEFAULTS.BASE_DEFENSE + defenseBonuses.resolve,
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
export function calculateSpeed(agility: number, speedBase = COMBAT_DEFAULTS.BASE_SPEED): number {
  return speedBase + Math.ceil(agility / 2);
}

/**
 * Calculate evasion from agility.
 * Evasion = evasionBase + agility
 */
export function calculateEvasion(agility: number, evasionBase = COMBAT_DEFAULTS.BASE_EVASION): number {
  return evasionBase + agility;
}

/**
 * Calculate max health from allocated points and abilities.
 */
export function calculateMaxHealth(
  healthPoints: number,
  vitality: number,
  level: number,
  archetypeAbility: AbilityName | string | undefined,
  abilities: Partial<Abilities>
): number {
  const useStrength = archetypeAbility?.toLowerCase() === 'vitality';
  const abilityMod = useStrength ? (abilities?.strength || 0) : vitality;
  
  if (abilityMod < 0) {
    return 8 + abilityMod + healthPoints;
  } else {
    return 8 + (abilityMod * level) + healthPoints;
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
 * Get the archetype ability score for a character (max of pow_abil or mart_abil).
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
export function getSpeedBase(charData: Partial<Character>): number {
  return charData?.speedBase ?? COMBAT_DEFAULTS.BASE_SPEED;
}

/**
 * Get the current evasion base value.
 */
export function getEvasionBase(charData: Partial<Character>): number {
  return charData?.evasionBase ?? COMBAT_DEFAULTS.BASE_EVASION;
}
