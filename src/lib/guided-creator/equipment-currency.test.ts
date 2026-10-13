import { describe, expect, it } from 'vitest';
import {
  computeRemainingCurrency,
  computeSpentCurrency,
  computeStartingCurrency,
  resolveItemUnitCost,
  resolveRefUnitCost,
} from '@/lib/guided-creator/equipment-currency';
import { calculateCurrencyCostAndRarity } from '@/lib/calculators/item-calc';
import { CHARACTER_STARTING_CURRENCY } from '@/lib/game/constants';

describe('equipment-currency', () => {
  it('computeStartingCurrency matches level-1 budget and grows at 1.45', () => {
    expect(computeStartingCurrency(1)).toBe(CHARACTER_STARTING_CURRENCY);
    expect(computeStartingCurrency(1)).toBe(200);
    expect(computeStartingCurrency(2)).toBe(Math.round(200 * 1.45));
  });

  it('spent / remaining currency use quantity × unit cost', () => {
    const spent = computeSpentCurrency([
      { cost: 40, quantity: 2 },
      { gold_cost: 5, quantity: 3 },
    ]);
    expect(spent).toBe(95);
    expect(computeRemainingCurrency(200, spent)).toBe(105);
  });

  it('uses explicit display gold_cost / currency (not property C sum)', () => {
    expect(resolveItemUnitCost({ gold_cost: 40, costs: { totalCurrency: 2 } })).toBe(40);
    expect(resolveItemUnitCost({ currency: 25, costs: { totalCurrency: 1 } })).toBe(25);
  });

  it('converts costs.totalCurrency + totalIP to market Currency (Library GLR protocol)', () => {
    const expected = calculateCurrencyCostAndRarity(2, 2).currencyCost;
    expect(
      resolveItemUnitCost({
        costs: { totalCurrency: 2, totalIP: 2 },
      }),
    ).toBe(expected);
    expect(expected).toBeGreaterThan(2);
  });

  it('resolveRefUnitCost converts official costs to market Currency', () => {
    const expected = calculateCurrencyCostAndRarity(1, 1).currencyCost;
    const cost = resolveRefUnitCost(
      { id: 'axe-1' },
      [{ id: 'axe-1', costs: { totalCurrency: 1, totalIP: 1 } }],
      [],
    );
    expect(cost).toBe(expected);
  });

  it('resolveRefUnitCost prefers codex display currency field', () => {
    const cost = resolveRefUnitCost(
      { id: 'rope' },
      [],
      [{ id: 'rope', currency: 5, gold_cost: 5 }],
    );
    expect(cost).toBe(5);
  });
});
