import { describe, expect, it } from 'vitest';
import type { Abilities, Character } from '@/types';
import { DEFAULT_ABILITIES } from '@/types';
import {
  calculateAllStats,
  calculateMaxEnergy,
  calculateMaxEnergyForArchetype,
  resolveEnergyArchetypeAbility,
} from '@/lib/game/calculations';

/** Powered-Martial: INT 1 (power) vs STR 3 (martial) — Energy must use the higher. */
const poweredMartialAbilities: Abilities = {
  ...DEFAULT_ABILITIES,
  intelligence: 1,
  strength: 3,
};

const poweredMartialLevel10: Partial<Character> = {
  level: 10,
  energyPoints: 4,
  pow_abil: 'intelligence',
  mart_abil: 'strength',
  abilities: poweredMartialAbilities,
};

describe('resolveEnergyArchetypeAbility (T1 / M3)', () => {
  it('picks the higher of Power and Martial Archetype Abilities', () => {
    expect(
      resolveEnergyArchetypeAbility(
        poweredMartialAbilities,
        'intelligence',
        'strength'
      )
    ).toBe('strength');
  });

  it('keeps Power when the two scores are equal', () => {
    expect(
      resolveEnergyArchetypeAbility(
        { ...DEFAULT_ABILITIES, intelligence: 2, strength: 2 },
        'intelligence',
        'strength'
      )
    ).toBe('intelligence');
  });

  it('falls back to the only defined Archetype Ability', () => {
    expect(
      resolveEnergyArchetypeAbility(poweredMartialAbilities, 'intelligence', undefined)
    ).toBe('intelligence');
    expect(
      resolveEnergyArchetypeAbility(poweredMartialAbilities, undefined, 'strength')
    ).toBe('strength');
  });
});

describe('calculateMaxEnergyForArchetype / calculateAllStats Powered-Martial Energy (T1)', () => {
  it('uses the higher Archetype Ability (STR 3), not Power-first (INT 1)', () => {
    // ability 3 × level 10 + energyPoints 4
    expect(
      calculateMaxEnergyForArchetype(
        4,
        poweredMartialAbilities,
        10,
        'intelligence',
        'strength'
      )
    ).toBe(34);
    expect(calculateAllStats(poweredMartialLevel10).maxEnergy).toBe(34);

    // Regression: passing pow_abil alone would have used INT 1 → 14
    expect(calculateMaxEnergy(4, 'intelligence', poweredMartialAbilities, 10)).toBe(14);
  });
});
