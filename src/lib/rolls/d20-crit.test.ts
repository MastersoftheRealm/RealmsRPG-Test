import { describe, expect, it } from 'vitest';
import {
  computeRollOutcome,
  d20CritAdjustment,
  normalizeCampaignRollDice,
  storedRollUsesD20CritAdjustment,
} from './die';

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

describe('storedRollUsesD20CritAdjustment', () => {
  it('matches sheet checks vs damage, Randomize, and roll-log custom pool', () => {
    expect(storedRollUsesD20CritAdjustment('skill', 'Athletics (STR)')).toBe(true);
    expect(storedRollUsesD20CritAdjustment('damage', 'Slashing Damage')).toBe(false);
    expect(storedRollUsesD20CritAdjustment('custom', 'Fireball: 1d20 → Burn')).toBe(false);
    expect(storedRollUsesD20CritAdjustment('custom', 'Custom Roll')).toBe(true);
  });
});

describe('normalizeCampaignRollDice', () => {
  it('derives isMax and isMin from value and die type', () => {
    expect(normalizeCampaignRollDice([{ type: 'd20', value: 20 }])).toEqual([
      { type: 'd20', value: 20, isMax: true, isMin: false },
    ]);
    expect(normalizeCampaignRollDice([{ type: 'd20', value: 1 }])).toEqual([
      { type: 'd20', value: 1, isMax: false, isMin: true },
    ]);
  });
});

describe('computeRollOutcome (API-012 / LIB1-007)', () => {
  const skillRoll = { type: 'skill' as const, title: 'Athletics (STR)' };

  it('sums dice, modifier, and single-d20 crit adjustment for sheet checks', () => {
    expect(computeRollOutcome([{ type: 'd20', value: 15 }], 3, skillRoll)).toEqual({
      total: 18,
      isCrit: false,
      isCritFail: false,
      critMessage: null,
    });
    expect(computeRollOutcome([{ type: 'd20', value: 20 }], 5, skillRoll)).toEqual({
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
        { type: 'damage', title: 'Slashing Damage' },
      ),
    ).toEqual({
      total: 12,
      isCrit: false,
      isCritFail: false,
      critMessage: null,
    });
  });

  it('does not adjust lone d20 for damage or Randomize-style custom rolls', () => {
    expect(
      computeRollOutcome([{ type: 'd20', value: 20 }], 0, { type: 'damage', title: 'Damage' }),
    ).toMatchObject({
      total: 20,
      isCrit: false,
      isCritFail: false,
    });
    expect(
      computeRollOutcome([{ type: 'd20', value: 1 }], 0, {
        type: 'custom',
        title: 'Power: 1d20 → Outcome',
      }),
    ).toMatchObject({ total: 1, isCrit: false, isCritFail: false });
  });
});
