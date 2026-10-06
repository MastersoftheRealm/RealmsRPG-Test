import { describe, expect, it } from 'vitest';
import { PART_IDS } from '@/lib/id-constants';
import { computePartTrainingPoints } from './part-training-points';
import { snapshotParts } from './power-composition.fixture';

describe('computePartTrainingPoints', () => {
  it('rounds a 2.5 TP instance up to 3', () => {
    expect(
      computePartTrainingPoints(
        { id: 297, name: 'Elemental Damage', base_tp: 2, op_1_tp: 0.5 },
        { op_1_lvl: 1 },
      ),
    ).toBe(3);
  });

  it('sums base and option TP and rounds the instance up', () => {
    expect(
      computePartTrainingPoints(
        { id: 1, name: 'Test', base_tp: 2, op_1_tp: 1, op_2_tp: 0, op_3_tp: 0 },
        { op_1_lvl: 2 },
      ),
    ).toBe(4);
  });

  it('floors Additional Damage opt1 contribution for techniques', () => {
    expect(
      computePartTrainingPoints(
        {
          id: PART_IDS.ADDITIONAL_DAMAGE,
          name: 'Additional Damage',
          base_tp: 0,
          op_1_tp: 1.5,
          op_2_tp: 0,
          op_3_tp: 0,
        },
        { op_1_lvl: 2 },
        'technique',
      ),
    ).toBe(3);
  });

  it('does not floor Additional Damage opt1 for powers', () => {
    expect(
      computePartTrainingPoints(
        {
          id: PART_IDS.ADDITIONAL_DAMAGE,
          name: 'Additional Damage',
          base_tp: 0,
          op_1_tp: 1.5,
          op_2_tp: 0,
          op_3_tp: 0,
        },
        { op_1_lvl: 1 },
        'power',
      ),
    ).toBe(2);
    expect(
      computePartTrainingPoints(
        {
          id: PART_IDS.ADDITIONAL_DAMAGE,
          name: 'Additional Damage',
          base_tp: 0,
          op_1_tp: 1.5,
          op_2_tp: 0,
          op_3_tp: 0,
        },
        { op_1_lvl: 2 },
        'power',
      ),
    ).toBe(3);
  });

  it('rounds Range 3 (base only) up to 1, and one option with it up to 1', () => {
    const range = { id: 383, name: 'Power Range', base_tp: 0.5, op_1_tp: 0.5 };
    expect(computePartTrainingPoints(range, { op_1_lvl: 0 })).toBe(1);
    expect(computePartTrainingPoints(range, { op_1_lvl: 1 })).toBe(1);
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
      computePartTrainingPoints(
        {
          id: PART_IDS.ADDITIONAL_DAMAGE,
          name: 'Additional Damage',
          base_tp: 0,
          op_1_tp: 1.5,
        },
        { op_1_lvl: 1 },
        'technique',
      ),
    ).toBe(1);
  });
});
