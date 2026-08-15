import { describe, expect, it } from 'vitest';
import { PART_IDS } from '@/lib/id-constants';
import { computePartTrainingPoints } from './part-training-points';

describe('computePartTrainingPoints', () => {
  it('sums base and option TP with floor on total', () => {
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
        { op_1_lvl: 2 },
        'power',
      ),
    ).toBe(3);
  });
});
