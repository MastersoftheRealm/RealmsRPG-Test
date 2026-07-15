import { describe, expect, it } from 'vitest';
import {
  resolveItemUnitCost,
  resolveRefUnitCost,
} from '@/lib/guided-creator/equipment-currency';

describe('equipment-currency', () => {
  it('reads official costs.totalCurrency for unit cost', () => {
    expect(
      resolveItemUnitCost({
        costs: { totalCurrency: 40 },
      })
    ).toBe(40);
  });

  it('resolveRefUnitCost uses official totalCurrency (not zero when only costs.* set)', () => {
    const cost = resolveRefUnitCost(
      { id: 'axe-1' },
      [{ id: 'axe-1', costs: { totalCurrency: 25 } }],
      []
    );
    expect(cost).toBe(25);
  });
});
