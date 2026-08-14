import { describe, expect, it } from 'vitest';
import {
  allocateHealthEnergyPool,
  calculateAbilityPoints,
  calculateArchetypeProgression,
  calculateCreatureCurrency,
  calculateCreatureFeatPoints,
  calculateCreatureTrainingPoints,
  calculateHealthEnergyPool,
  calculateMaxArchetypeFeats,
  calculateProficiency,
  calculateSkillBonusWithProficiency,
  calculateSkillPointsForEntity,
  calculateSubSkillBonusWithProficiency,
  pickHighestEnergyCost,
  resolveArchetypeProficiencyStart,
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

  // T2 / M1 / M2 — sheet unarmed attack and unproficient damage
  // (`archetype-section.tsx`) both call `unproficientBonus`; do not reintroduce
  // floor() or Math.max(1, …). Unproficient damage display is String(that bonus).
  it.each([
    [-3, -6],
    [-2, -4],
    [-1, -2],
    [0, 0],
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 2],
    [5, 3],
  ] as const)(
    'unarmed unproficient attack/damage for ability %i is %i',
    (ability, expected) => {
      expect(unproficientBonus(ability)).toBe(expected);
    }
  );

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

describe('calculateSkillPointsForEntity (T3 / M4)', () => {
  it.each([1, 5, 20] as const)(
    'character skill points are 3 × level (%i), independent of species',
    (level) => {
      // Sheet `use-character-sheet-derived` and creator `getTotalSkillPoints`
      // both call this function (no speciesCount dance).
      const engine = calculateSkillPointsForEntity(level, 'character');
      expect(engine).toBe(3 * level);
      // Historical sheet `2 + level*3 − speciesCount` granted +2 when species
      // lookup failed (speciesCount 0). Engine must not.
      expect(engine).not.toBe(2 + level * 3);
    }
  );
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

describe('resolveArchetypeProficiencyStart', () => {
  it('uses type defaults when the path has no start columns', () => {
    expect(resolveArchetypeProficiencyStart('power')).toEqual({ pow_prof: 2, mart_prof: 0 });
    expect(resolveArchetypeProficiencyStart('martial')).toEqual({ pow_prof: 0, mart_prof: 2 });
    expect(resolveArchetypeProficiencyStart('powered-martial')).toEqual({
      pow_prof: 1,
      mart_prof: 1,
    });
  });

  it('prefers path start columns over type defaults', () => {
    expect(
      resolveArchetypeProficiencyStart('power', { power_prof_start: 3, martial_prof_start: 1 })
    ).toEqual({ pow_prof: 3, mart_prof: 1 });
  });
});

describe('parseLevel does not collapse 0 or 0.25 to 1 (T5 / N1)', () => {
  it('treats level 0 as empty progression, not level 1', () => {
    expect(calculateAbilityPoints(0)).toBe(0);
    expect(calculateAbilityPoints(0)).not.toBe(calculateAbilityPoints(1));
    expect(calculateProficiency(0)).toBe(0);
    expect(calculateProficiency(0)).not.toBe(calculateProficiency(1));
    expect(calculateHealthEnergyPool(0)).toBe(0);
    expect(calculateHealthEnergyPool(0)).not.toBe(calculateHealthEnergyPool(1));
    expect(calculateCreatureTrainingPoints(0)).toBe(0);
    expect(calculateCreatureTrainingPoints(0)).not.toBe(calculateCreatureTrainingPoints(1));
    expect(calculateCreatureFeatPoints(0)).toBe(0);
    expect(calculateCreatureFeatPoints(0)).not.toBe(calculateCreatureFeatPoints(1));
    expect(calculateCreatureCurrency(0)).not.toBe(calculateCreatureCurrency(1));
  });

  it('keeps creature sub-levels distinct from level 1', () => {
    expect(calculateAbilityPoints(0.25, true)).not.toBe(calculateAbilityPoints(1, true));
    expect(calculateProficiency(0.25, true)).not.toBe(calculateProficiency(1, true));
    expect(calculateHealthEnergyPool(0.25, 'CREATURE', true)).not.toBe(
      calculateHealthEnergyPool(1, 'CREATURE', true)
    );
    expect(calculateCreatureTrainingPoints(0.25)).not.toBe(calculateCreatureTrainingPoints(1));
    expect(calculateCreatureFeatPoints(0.25)).not.toBe(calculateCreatureFeatPoints(1));
    expect(calculateCreatureCurrency(0.25)).not.toBe(calculateCreatureCurrency(1));
  });
});

describe('calculateMaxArchetypeFeats (M9)', () => {
  it('matches GAME_RULES L1 totals: Power 1, Powered-Martial 2, Martial 3', () => {
    expect(calculateMaxArchetypeFeats(1, 'power')).toBe(1);
    expect(calculateMaxArchetypeFeats(1, 'powered-martial')).toBe(2);
    expect(calculateMaxArchetypeFeats(1, 'martial')).toBe(3);
  });

  it('counts Powered-Martial milestone feat picks and ignores innate picks', () => {
    expect(calculateMaxArchetypeFeats(4, 'powered-martial')).toBe(5);
    expect(calculateMaxArchetypeFeats(4, 'powered-martial', undefined, { 4: 'feat' })).toBe(6);
    expect(calculateMaxArchetypeFeats(4, 'powered-martial', undefined, { 4: 'innate' })).toBe(5);
    expect(
      calculateMaxArchetypeFeats(4, 'powered-martial', undefined, { 4: 'feat' })
    ).toBe(4 + calculateArchetypeProgression(4, 1, 1, { 4: 'feat' }).bonusArchetypeFeats);
  });
});

describe('calculateSubSkillBonusWithProficiency (M13)', () => {
  it('uses unproficientBonus when the base skill is unproficient', () => {
    expect(
      calculateSubSkillBonusWithProficiency('strength', 2, 0, false, abilities, false)
    ).toBe(unproficientBonus(-2) + 0);
  });
});
