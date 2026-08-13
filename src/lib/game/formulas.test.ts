import { describe, expect, it } from 'vitest';
import {
  allocateHealthEnergyPool,
  calculateArchetypeProgression,
  calculateSkillBonusWithProficiency,
  pickHighestEnergyCost,
  unproficientBonus,
} from '@/lib/game/formulas';
import type { Abilities } from '@/types';

const abilities: Abilities = {
  strength: -2,
  vitality: 0,
  agility: 3,
  acuity: 0,
  intelligence: 0,
  charisma: 0,
};

describe('unproficientBonus', () => {
  it('doubles negative modifiers and halves non-negative (rounded up)', () => {
    expect(unproficientBonus(-2)).toBe(-4);
    expect(unproficientBonus(0)).toBe(0);
    expect(unproficientBonus(3)).toBe(2);
    expect(unproficientBonus(5)).toBe(3);
  });

  it('calculateSkillBonusWithProficiency uses unproficientBonus when not proficient', () => {
    expect(
      calculateSkillBonusWithProficiency('strength', 2, abilities, false)
    ).toBe(unproficientBonus(-2));
    expect(
      calculateSkillBonusWithProficiency('agility', 2, abilities, false)
    ).toBe(unproficientBonus(3));
  });
});

describe('calculateArchetypeProgression innate thresholds', () => {
  it('Power uses level table (8 at L1, 9 at L4, 14 at L19)', () => {
    expect(calculateArchetypeProgression(1, 0, 2).innateThreshold).toBe(8);
    expect(calculateArchetypeProgression(4, 0, 2).innateThreshold).toBe(9);
    expect(calculateArchetypeProgression(19, 0, 5).innateThreshold).toBe(14);
  });

  it('Powered-Martial first Increase Innate Power is 6→8, then +1', () => {
    const base = calculateArchetypeProgression(4, 1, 1, {});
    expect(base.innateThreshold).toBe(6);
    expect(base.innatePools).toBe(1);

    const first = calculateArchetypeProgression(4, 1, 1, { 4: 'innate' });
    expect(first.innateThreshold).toBe(8);
    expect(first.innatePools).toBe(2);
    expect(first.innateEnergy).toBe(16);

    const second = calculateArchetypeProgression(7, 1, 1, { 4: 'innate', 7: 'innate' });
    expect(second.innateThreshold).toBe(9);
    expect(second.innatePools).toBe(3);
  });
});

describe('allocateHealthEnergyPool', () => {
  it('puts leftover pool into Health after covering the highest Energy cost', () => {
    expect(
      allocateHealthEnergyPool({ baseEnergy: 3, pool: 18, highestEnergyCost: 8 })
    ).toEqual({ hpBonus: 13, energyBonus: 5 });
  });

  it('spends the whole pool on Health when there is no Energy cost', () => {
    expect(
      allocateHealthEnergyPool({ baseEnergy: 4, pool: 18, highestEnergyCost: 0 })
    ).toEqual({ hpBonus: 18, energyBonus: 0 });
  });

  it('caps Energy at the pool when the cost exceeds base + pool', () => {
    expect(
      allocateHealthEnergyPool({ baseEnergy: 2, pool: 18, highestEnergyCost: 40 })
    ).toEqual({ hpBonus: 0, energyBonus: 18 });
  });

  it('needs no Energy bonus when base Energy already covers the cost', () => {
    expect(
      allocateHealthEnergyPool({ baseEnergy: 10, pool: 18, highestEnergyCost: 8 })
    ).toEqual({ hpBonus: 18, energyBonus: 0 });
  });
});

describe('pickHighestEnergyCost', () => {
  it('returns the highest Energy pick and keeps the first on a tie', () => {
    expect(
      pickHighestEnergyCost([
        { name: 'Spark', energy: 4, kind: 'power' },
        { name: 'Bolt', energy: 8, kind: 'power' },
        { name: 'Strike', energy: 8, kind: 'technique' },
      ])
    ).toEqual({ name: 'Bolt', energy: 8, kind: 'power' });
  });

  it('returns null for an empty list', () => {
    expect(pickHighestEnergyCost([])).toBeNull();
  });
});
