import { describe, expect, it } from 'vitest';
import { computeRollOutcome, d20CritAdjustment } from './die';

describe('d20 crit adjustment (86e3jz6py)', () => {
  it('adds 2 on a lone natural 20 and subtracts 2 on a lone natural 1', () => {
    expect(d20CritAdjustment([{ type: 'd20', value: 20 }])).toEqual({
      isCrit: true,
      isCritFail: false,
      adjustment: 2,
    });
    expect(d20CritAdjustment([{ type: 'd20', value: 1 }])).toEqual({
      isCrit: false,
      isCritFail: true,
      adjustment: -2,
    });
    expect(d20CritAdjustment([{ type: 'd20', value: 10 }]).adjustment).toBe(0);
  });

  it('does not adjust a mixed pool or a second d20', () => {
    expect(
      d20CritAdjustment([
        { type: 'd20', value: 20 },
        { type: 'd6', value: 6 },
      ]),
    ).toEqual({ isCrit: false, isCritFail: false, adjustment: 0 });
    expect(
      d20CritAdjustment([
        { type: 'd20', value: 1 },
        { type: 'd8', value: 3 },
      ]).adjustment,
    ).toBe(0);
    expect(
      d20CritAdjustment([
        { type: 'd20', value: 20 },
        { type: 'd20', value: 20 },
      ]).adjustment,
    ).toBe(0);
    expect(d20CritAdjustment([{ type: 'd6', value: 6 }]).adjustment).toBe(0);
  });
});

describe('computeRollOutcome (API-012 / LIB1-007)', () => {
  it('sums dice, modifier, and single-d20 crit adjustment', () => {
    expect(computeRollOutcome([{ type: 'd20', value: 15 }], 3)).toEqual({
      total: 18,
      isCrit: false,
      isCritFail: false,
      critMessage: null,
    });
    expect(computeRollOutcome([{ type: 'd20', value: 20 }], 5)).toEqual({
      total: 27,
      isCrit: true,
      isCritFail: false,
      critMessage: 'Natural 20! +2 to the total!',
    });
    expect(
      computeRollOutcome(
        [
          { type: 'd6', value: 4 },
          { type: 'd6', value: 6 },
        ],
        2,
      ),
    ).toEqual({
      total: 12,
      isCrit: false,
      isCritFail: false,
      critMessage: null,
    });
  });
});
