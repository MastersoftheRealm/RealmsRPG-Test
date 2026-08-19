/**
 * Guided powers/techniques L2 Energy filter (TASK-463 / TASK-687).
 * Prefer theoretical L1 max Energy (full HP/EN pool of 18 → Energy + archetype ability);
 * fallback: exclude Energy > 20 when calc inputs are missing.
 *
 * Archetype ability (GAME_RULES): Power track uses `pow_abil`; Techniques / Martial
 * track uses `mart_abil`. Callers must pass the ability for the active kind.
 */

import { calculateMaxEnergy } from '@/lib/game/calculations';
import { PLAYER_CONSTANTS } from '@/lib/game/constants';
import type { Abilities, AbilityName } from '@/types';

/** L1 HP/EN pool all-to-Energy for theoretical max (GAME_RULES). */
export const GUIDED_L1_FULL_ENERGY_POOL = PLAYER_CONSTANTS.BASE_HIT_ENERGY;

/** Fallback catalog Energy ceiling when max Energy cannot be calculated. */
export const GUIDED_L2_ENERGY_FALLBACK_MAX = 20;

export interface GuidedL1MaxEnergyInput {
  /**
   * Archetype ability for Energy: `pow_abil` on the Power track,
   * `mart_abil` on the Techniques / Martial track (TASK-687).
   */
  archetypeAbility?: AbilityName | string | null | undefined;
  abilities?: Partial<Abilities> | null | undefined;
  level?: number | undefined;
}

/**
 * Theoretical max Energy at level 1 with the full hit/energy pool allocated to Energy.
 * Returns null when archetype ability or abilities are missing (caller uses fallback filter).
 */
export function calculateGuidedL1TheoreticalMaxEnergy(
  input: GuidedL1MaxEnergyInput,
): number | null {
  const ability = input.archetypeAbility;
  const abilities = input.abilities;
  if (!ability || !abilities) return null;
  const level = Math.max(1, Math.floor(input.level ?? 1));
  return calculateMaxEnergy(GUIDED_L1_FULL_ENERGY_POOL, ability, abilities, level);
}

/**
 * True when the item’s Energy cost is allowed in the non-innate L2 catalog.
 * Missing/unknown energy is allowed (cannot exclude safely).
 */
export function isGuidedL2EnergyAllowed(
  energy: number | null | undefined,
  maxEnergy: number | null,
): boolean {
  if (energy == null || Number.isNaN(Number(energy))) return true;
  const cost = Math.max(0, Math.floor(Number(energy)));
  if (maxEnergy != null && Number.isFinite(maxEnergy)) {
    return cost <= maxEnergy;
  }
  return cost <= GUIDED_L2_ENERGY_FALLBACK_MAX;
}
