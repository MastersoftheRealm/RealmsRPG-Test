import { describe, expect, it } from 'vitest';
import type { CharacterProficiency } from '@/types';
import { calculateProficiencyTP, hasSufficientProficiency } from './proficiencies';

function fire(op1Level: number): CharacterProficiency {
  return {
    id: `fire-${op1Level}`,
    kind: 'power_part',
    name: 'Elemental Damage',
    damageType: 'fire',
    baseTP: 2,
    op1TP: 0.5,
    op1Level,
  };
}

describe('calculateProficiencyTP', () => {
  it('rounds each instance up, so 2.5 TP is 3', () => {
    expect(calculateProficiencyTP(fire(0))).toBe(2);
    expect(calculateProficiencyTP(fire(1))).toBe(3);
    expect(calculateProficiencyTP(fire(4))).toBe(4);
  });
});

describe('hasSufficientProficiency', () => {
  it('treats a higher die of the same damage type as covering a lower die', () => {
    const owned = fire(4);
    expect(hasSufficientProficiency([owned], fire(0))).toBe(true);
    expect(hasSufficientProficiency([owned], fire(4))).toBe(true);
    expect(hasSufficientProficiency([fire(0)], fire(4))).toBe(false);
    expect(hasSufficientProficiency([fire(4)], { ...fire(0), damageType: 'ice' })).toBe(false);
  });

  it('still covers a lower level after each instance rounds up', () => {
    expect(hasSufficientProficiency([fire(1)], fire(0))).toBe(true);
    expect(hasSufficientProficiency([fire(0)], fire(1))).toBe(false);
  });
});
