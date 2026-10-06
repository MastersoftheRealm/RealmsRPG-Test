import { describe, expect, it } from 'vitest';
import type { CharacterProficiency } from '@/types';
import { PART_IDS } from '@/lib/id-constants';
import { calculateProficiencyTP, hasSufficientProficiency } from './proficiencies';

function fire(op1Level: number): CharacterProficiency {
  return {
    id: `fire-${op1Level}`,
    kind: 'power_part',
    refId: String(PART_IDS.ELEMENTAL_DAMAGE),
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

  it('fails a higher die when rounded TP collides, and a higher die covers the lower one', () => {
    // 1d6 is option level 1; 1d8 is option level 2. Both publish as 3 TP.
    expect(calculateProficiencyTP(fire(1))).toBe(3);
    expect(calculateProficiencyTP(fire(2))).toBe(3);
    expect(hasSufficientProficiency([fire(1)], fire(2))).toBe(false);
    expect(hasSufficientProficiency([fire(2)], fire(1))).toBe(true);
    expect(hasSufficientProficiency([fire(2)], { ...fire(1), damageType: 'ice' })).toBe(false);
  });

  it('compares option level when a fractional option rounds to the same TP', () => {
    const row = (level: number): CharacterProficiency => ({
      id: `opt-${level}`,
      kind: 'power_part',
      refId: 'narrow-step',
      name: 'Narrow Step',
      baseTP: 0.5,
      op1TP: 0.1,
      op1Level: level,
    });
    expect(calculateProficiencyTP(row(1))).toBe(1);
    expect(calculateProficiencyTP(row(2))).toBe(1);
    expect(hasSufficientProficiency([row(1)], row(2))).toBe(false);
    expect(hasSufficientProficiency([row(2)], row(1))).toBe(true);
  });

  it('compares Training Points when two parts share a damage type', () => {
    const elemental = fire(2);
    const additional = (op1Level: number, baseTP: number, op1TP: number): CharacterProficiency => ({
      id: `add-${op1Level}-${baseTP}`,
      kind: 'technique_part',
      refId: String(PART_IDS.ADDITIONAL_DAMAGE),
      name: 'Additional Damage',
      damageType: 'fire',
      baseTP,
      op1TP,
      op1Level,
    });
    // Higher option level, lower published TP: level is not the comparison.
    expect(calculateProficiencyTP(additional(4, 0, 0.5))).toBe(2);
    expect(hasSufficientProficiency([additional(4, 0, 0.5)], elemental)).toBe(false);
    // Lower option level, enough Training Points: the TP comparison covers.
    expect(calculateProficiencyTP(additional(0, 4, 0))).toBe(4);
    expect(hasSufficientProficiency([additional(0, 4, 0)], elemental)).toBe(true);
  });
});
