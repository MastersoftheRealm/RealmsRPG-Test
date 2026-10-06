import { describe, expect, it } from 'vitest';
import { PART_IDS } from '@/lib/id-constants';
import { computePartTrainingPoints } from './part-training-points';
import { snapshotParts } from './power-composition.fixture';

/** Synthetic Additional Damage rates. Real id 6 is base 1 / option 0.5 in the snapshot. */
const SYNTHETIC_ADDITIONAL_DAMAGE = {
  id: 906,
  name: 'Additional Damage',
  base_tp: 0,
  op_1_tp: 1.5,
  op_2_tp: 0,
  op_3_tp: 0,
};

describe('computePartTrainingPoints', () => {
  it('rounds a 2.5 TP instance up to 3', () => {
    const elemental = snapshotParts([PART_IDS.ELEMENTAL_DAMAGE])[0]!;
    const published = Math.ceil((elemental.base_tp ?? 0) + (elemental.op_1_tp ?? 0));
    expect(computePartTrainingPoints(elemental, { op_1_lvl: 1 })).toBe(published);
    expect(published).toBe(3);
  });

  it('sums base and option TP and rounds the instance up', () => {
    expect(
      computePartTrainingPoints(
        { id: 901, name: 'Test', base_tp: 2, op_1_tp: 1, op_2_tp: 0, op_3_tp: 0 },
        { op_1_lvl: 2 },
      ),
    ).toBe(4);
  });

  it('floors Additional Damage opt1 contribution for techniques', () => {
    expect(
      computePartTrainingPoints(SYNTHETIC_ADDITIONAL_DAMAGE, { op_1_lvl: 2 }, 'technique'),
    ).toBe(3);
  });

  it('does not floor Additional Damage opt1 for powers', () => {
    expect(computePartTrainingPoints(SYNTHETIC_ADDITIONAL_DAMAGE, { op_1_lvl: 1 }, 'power')).toBe(
      2,
    );
    expect(computePartTrainingPoints(SYNTHETIC_ADDITIONAL_DAMAGE, { op_1_lvl: 2 }, 'power')).toBe(
      3,
    );
  });

  it('rounds the snapshot Additional Damage row up once, and floors techniques first', () => {
    const additional = snapshotParts([PART_IDS.ADDITIONAL_DAMAGE])[0]!;
    const published = (level: number, variant: 'power' | 'technique') => {
      const option = (additional.op_1_tp ?? 0) * level;
      const opt1 = variant === 'technique' ? Math.floor(option) : option;
      return Math.ceil((additional.base_tp ?? 0) + opt1);
    };
    expect(computePartTrainingPoints(additional, { op_1_lvl: 1 }, 'technique')).toBe(
      published(1, 'technique'),
    );
    expect(published(1, 'technique')).toBe(1);
    expect(computePartTrainingPoints(additional, { op_1_lvl: 1 }, 'power')).toBe(
      published(1, 'power'),
    );
    expect(published(1, 'power')).toBe(2);
  });

  it('rounds Range 3 (base only) up to 1, and one option with it up to 1', () => {
    const range = snapshotParts([PART_IDS.POWER_RANGE])[0]!;
    const published = (level: number) =>
      Math.ceil((range.base_tp ?? 0) + (range.op_1_tp ?? 0) * level);
    expect(computePartTrainingPoints(range, { op_1_lvl: 0 })).toBe(published(0));
    expect(published(0)).toBe(1);
    expect(computePartTrainingPoints(range, { op_1_lvl: 1 })).toBe(published(1));
    expect(published(1)).toBe(1);
  });

  it('rounds one Power Range instance up once: 6 spaces is 1 TP and 12 spaces is 2 TP', () => {
    const range = snapshotParts([PART_IDS.POWER_RANGE])[0]!;
    // Codex base is 3 spaces. Each option adds 3 spaces, so option level is spaces/3 - 1.
    const levelForSpaces = (spaces: number) => spaces / 3 - 1;
    const expected = (spaces: number) =>
      Math.ceil((range.base_tp ?? 0) + (range.op_1_tp ?? 0) * levelForSpaces(spaces));

    expect(levelForSpaces(6)).toBe(1);
    expect(levelForSpaces(12)).toBe(3);
    expect(computePartTrainingPoints(range, { op_1_lvl: levelForSpaces(6) })).toBe(expected(6));
    expect(expected(6)).toBe(1);
    expect(computePartTrainingPoints(range, { op_1_lvl: levelForSpaces(12) })).toBe(expected(12));
    expect(expected(12)).toBe(2);
  });

  it('floors technique Additional Damage option 1 before the instance rounds up', () => {
    expect(
      computePartTrainingPoints(SYNTHETIC_ADDITIONAL_DAMAGE, { op_1_lvl: 1 }, 'technique'),
    ).toBe(1);
  });
});
