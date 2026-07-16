/**
 * Guided L2 Energy filter helpers (TASK-463).
 */

import { describe, expect, it } from 'vitest';
import {
  calculateGuidedL1TheoreticalMaxEnergy,
  GUIDED_L1_FULL_ENERGY_POOL,
  GUIDED_L2_ENERGY_FALLBACK_MAX,
  isGuidedL2EnergyAllowed,
} from './powers-techniques-energy-filter';

describe('powers-techniques-energy-filter', () => {
  it('uses full L1 pool of 18 for theoretical max Energy', () => {
    expect(GUIDED_L1_FULL_ENERGY_POOL).toBe(18);
    // ability mod 2 at L1 → 2*1 + 18 = 20
    expect(
      calculateGuidedL1TheoreticalMaxEnergy({
        archetypeAbility: 'intelligence',
        abilities: { intelligence: 2 },
        level: 1,
      })
    ).toBe(20);
  });

  it('returns null when ability inputs are missing', () => {
    expect(
      calculateGuidedL1TheoreticalMaxEnergy({
        archetypeAbility: null,
        abilities: { intelligence: 2 },
      })
    ).toBeNull();
    expect(
      calculateGuidedL1TheoreticalMaxEnergy({
        archetypeAbility: 'acuity',
        abilities: null,
      })
    ).toBeNull();
  });

  it('filters by max Energy when known, else fallback > 20', () => {
    expect(isGuidedL2EnergyAllowed(20, 20)).toBe(true);
    expect(isGuidedL2EnergyAllowed(21, 20)).toBe(false);
    expect(isGuidedL2EnergyAllowed(20, null)).toBe(true);
    expect(isGuidedL2EnergyAllowed(21, null)).toBe(false);
    expect(isGuidedL2EnergyAllowed(GUIDED_L2_ENERGY_FALLBACK_MAX, null)).toBe(true);
    expect(isGuidedL2EnergyAllowed(undefined, 18)).toBe(true);
  });
});
