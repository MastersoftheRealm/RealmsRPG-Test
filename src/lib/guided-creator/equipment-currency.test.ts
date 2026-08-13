import { describe, expect, it } from 'vitest';
import {
  clampSavedCurrency,
  resolveItemUnitCost,
  resolveRefUnitCost,
} from '@/lib/guided-creator/equipment-currency';
import { calculateCurrencyCostAndRarity } from '@/lib/calculators/item-calc';

describe('equipment-currency', () => {
  it('uses explicit display gold_cost / currency (not property C sum)', () => {
    expect(resolveItemUnitCost({ gold_cost: 40, costs: { totalCurrency: 2 } })).toBe(40);
    expect(resolveItemUnitCost({ currency: 25, costs: { totalCurrency: 1 } })).toBe(25);
  });

  it('converts costs.totalCurrency + totalIP to market Currency (Library GLR protocol)', () => {
    const expected = calculateCurrencyCostAndRarity(2, 2).currencyCost;
    expect(
      resolveItemUnitCost({
        costs: { totalCurrency: 2, totalIP: 2 },
      })
    ).toBe(expected);
    expect(expected).toBeGreaterThan(2);
  });

  it('resolveRefUnitCost converts official costs to market Currency', () => {
    const expected = calculateCurrencyCostAndRarity(1, 1).currencyCost;
    const cost = resolveRefUnitCost(
      { id: 'axe-1' },
      [{ id: 'axe-1', costs: { totalCurrency: 1, totalIP: 1 } }],
      []
    );
    expect(cost).toBe(expected);
  });

  it('resolveRefUnitCost prefers codex display currency field', () => {
    const cost = resolveRefUnitCost(
      { id: 'rope' },
      [],
      [{ id: 'rope', currency: 5, gold_cost: 5 }]
    );
    expect(cost).toBe(5);
  });

  it('clampSavedCurrency floors a signed remainder at 0', () => {
    expect(clampSavedCurrency(40)).toBe(40);
    expect(clampSavedCurrency(0)).toBe(0);
    expect(clampSavedCurrency(-25)).toBe(0);
  });
});
