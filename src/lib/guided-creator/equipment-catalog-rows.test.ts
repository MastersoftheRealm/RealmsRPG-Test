import { describe, expect, it } from 'vitest';
import { buildEquipmentCatalogRows } from '@/lib/guided-creator/equipment-catalog-rows';
import { calculateCurrencyCostAndRarity } from '@/lib/calculators/item-calc';
import type { LibraryItem } from '@/types/library';

describe('equipment-catalog-rows currency', () => {
  it('official gold_cost is market Currency, not costs.totalCurrency', () => {
    const item = {
      id: 'axe-1',
      docId: 'axe-1',
      name: 'Axe',
      type: 'weapon' as const,
      properties: [],
      costs: { totalCurrency: 2, totalIP: 2, totalTP: 4 },
    } satisfies LibraryItem;

    const catalog = buildEquipmentCatalogRows([item], [], []);
    const row = catalog.get('axe-1');
    const expected = calculateCurrencyCostAndRarity(2, 2).currencyCost;

    expect(row?.gold_cost).toBe(expected);
    expect(row?.gold_cost).not.toBe(2);
  });
});
