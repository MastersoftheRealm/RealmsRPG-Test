import { describe, expect, it } from 'vitest';
import {
  armorStatsForRef,
  buildEquipmentCatalogRows,
  libraryRowForRef,
  weaponDamageLineForRef,
} from '@/lib/guided-creator/equipment-catalog-rows';
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

  it('keeps Codex taxonomy category when official row has none (TASK-724)', () => {
    const official = {
      id: 'rope-1',
      docId: 'rope-1',
      name: 'Rope',
      type: 'equipment' as const,
      properties: [],
    } satisfies LibraryItem;
    const catalog = buildEquipmentCatalogRows(
      [official],
      [
        {
          id: 'rope-1',
          name: 'Rope',
          type: 'equipment',
          category: 'Adventuring',
          description: '',
          gold_cost: 5,
          currency: 5,
          properties: [],
        },
      ],
      [],
    );
    expect(catalog.get('rope-1')?.itemCategory).toBe('Adventuring');
  });

  it('resolves official rows by docId as well as id (TASK-732)', () => {
    const official = {
      id: 'axe-1',
      docId: 'user-axe-uuid',
      name: 'Axe',
      type: 'weapon' as const,
      properties: [],
      damage: [{ amount: 1, size: 8, type: 'slashing' }],
      agilityReduction: 0,
    } satisfies LibraryItem;

    const catalog = buildEquipmentCatalogRows([official], [], []);
    expect(catalog.get('user-axe-uuid')?.name).toBe('Axe');
    expect(libraryRowForRef('USER-AXE-UUID', [official], [])?.name).toBe('Axe');
    expect(weaponDamageLineForRef('user-axe-uuid', [official], [])).toMatch(/d8/i);
    expect(armorStatsForRef('missing', [official], [])).toEqual({});
  });
});
