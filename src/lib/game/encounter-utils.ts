/**
 * Encounter Utility Functions
 * ============================
 * Helper calculations for encounters — creature HP/EN from library data.
 * Based on formulas from GAME_RULES.md and formulas.ts.
 */

/**
 * Compute successes or failures from a skill roll vs Difficulty Score.
 * Per GAME_RULES: Success = roll >= DS (+1 per 5 over); Failure = roll < DS (+1 per 5 under).
 */
export function computeSkillRollResult(roll: number, ds: number): { successes: number; failures: number } {
  if (roll >= ds) {
    const successes = 1 + Math.floor((roll - ds) / 5);
    return { successes, failures: 0 };
  }
  const failures = 1 + Math.floor((ds - roll) / 5);
  return { successes: 0, failures };
}

import { calculateHealthEnergyPool } from './formulas';
import { CREATURE_CONSTANTS } from './constants';

/**
 * Calculate a creature's max health.
 *
 * Max Health = pool base (level-based for creatures) + vitality + hitPoints allocation
 *
 * The pool base is: 26 + 12*(level-1)
 * Hit points are part of the health-energy split.
 * In the creature creator, `hitPoints` represents the number of pool points
 * allocated to health (each gives +1 max HP).
 */
export function calculateCreatureMaxHealth(
  level: number,
  vitality: number,
  hitPoints: number
): number {
  const pool = calculateHealthEnergyPool(level, 'CREATURE');
  // hitPoints is the allocated portion of the pool; the creature's final HP
  // is: hitPoints + vitality (vitality adds 1 HP each).
  // However, if hitPoints=0 and no explicit allocation, default to half pool.
  const hpAlloc = hitPoints > 0 ? hitPoints : Math.ceil(pool / 2);
  return hpAlloc + (vitality || 0);
}

/**
 * Calculate a creature's max energy.
 *
 * Max Energy = remaining pool points (pool - hitPoints) + aptitude/resonance bonus
 * In simpler terms: energyPoints + relevant ability.
 */
export function calculateCreatureMaxEnergy(
  level: number,
  abilities: Record<string, number | undefined>,
  energyPoints: number
): number {
  const pool = calculateHealthEnergyPool(level, 'CREATURE');
  const enAlloc = energyPoints > 0 ? energyPoints : Math.floor(pool / 2);
  // Use aptitude or resonance as the energy-boosting ability
  const aptitude = abilities?.aptitude ?? abilities?.apt ?? 0;
  const resonance = abilities?.resonance ?? abilities?.res ?? 0;
  return enAlloc + Math.max(aptitude || 0, resonance || 0);
}
