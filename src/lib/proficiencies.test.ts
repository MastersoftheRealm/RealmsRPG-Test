import { describe, expect, it } from 'vitest';
import type { CharacterProficiency } from '@/types';
import { PART_IDS } from '@/lib/id-constants';
import { snapshotParts } from '@/lib/calculators/power-composition.fixture';
import { calculateProficiencyTP, hasSufficientProficiency } from './proficiencies';

const elementalDamage = snapshotParts([PART_IDS.ELEMENTAL_DAMAGE])[0]!;

function fire(
  op1Level: number,
  refId: string | null = String(PART_IDS.ELEMENTAL_DAMAGE),
): CharacterProficiency {
  return {
    id: `fire-${op1Level}-${refId ?? 'none'}`,
    kind: 'power_part',
    ...(refId != null ? { refId } : {}),
    name: elementalDamage.name,
    damageType: 'fire',
    baseTP: elementalDamage.base_tp ?? 0,
    op1TP: elementalDamage.op_1_tp ?? 0,
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

  it('matches by part name when a saved proficiency has no part id, so 1d6 does not cover 1d8', () => {
    const unnamed = (level: number) => fire(level, null);
    expect(calculateProficiencyTP(unnamed(1))).toBe(3);
    expect(calculateProficiencyTP(unnamed(2))).toBe(3);
    expect(hasSufficientProficiency([unnamed(1)], unnamed(2))).toBe(false);
    expect(hasSufficientProficiency([unnamed(2)], unnamed(1))).toBe(true);
    expect(hasSufficientProficiency([unnamed(1)], fire(2))).toBe(false);
    expect(hasSufficientProficiency([fire(2)], unnamed(1))).toBe(true);
    // Both sides have ids, so a shared name still falls through to Training Points.
    expect(hasSufficientProficiency([fire(1, '906')], fire(2, '907'))).toBe(true);
  });

  it('does not use the name fallback across power, technique, and item parts', () => {
    const powerDie = fire(1, null);
    const techniqueDie: CharacterProficiency = {
      ...fire(2, null),
      id: 'tech-2',
      kind: 'technique_part',
    };
    // Both publish as 3 TP, so option level would reject this and Training Points would not.
    expect(calculateProficiencyTP(powerDie)).toBe(3);
    expect(calculateProficiencyTP(techniqueDie)).toBe(3);
    expect(hasSufficientProficiency([powerDie], techniqueDie)).toBe(true);
    expect(hasSufficientProficiency([techniqueDie], powerDie)).toBe(true);
  });

  it('compares Training Points when two parts share a damage type', () => {
    const elemental = fire(2);
    const additional = (op1Level: number, baseTP: number, op1TP: number): CharacterProficiency => ({
      id: `add-${op1Level}-${baseTP}`,
      kind: 'technique_part',
      refId: '906',
      name: 'Synthetic Damage',
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
