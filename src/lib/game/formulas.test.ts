import { describe, expect, it } from 'vitest';
import {
  calculateArchetypeProgression,
  calculateSkillBonusWithProficiency,
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
