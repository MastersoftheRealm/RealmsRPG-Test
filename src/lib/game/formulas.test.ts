import { describe, expect, it } from 'vitest';
import {
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
