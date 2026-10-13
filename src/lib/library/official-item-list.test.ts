import { describe, expect, it } from 'vitest';
import {
  ARMAMENT_LIBRARY_CONFIG,
  armamentRowColumns,
  buildOfficialItemRows,
  countItemsByArmamentKind,
  filterItemsByArmamentKind,
} from '@/lib/library/official-item-list';
import type { LibraryItem } from '@/types/library';
import type { ItemProperty } from '@/hooks/codex-types';

const propertiesDb: never[] = [];

function item(
  partial: Partial<LibraryItem> & Pick<LibraryItem, 'id' | 'name' | 'type'>,
): LibraryItem {
  return {
    docId: partial.id,
    properties: [],
    ...partial,
  };
}

describe('official-item-list armament kinds', () => {
  const catalog: LibraryItem[] = [
    item({
      id: 'w1',
      name: 'Longsword',
      type: 'weapon',
      damage: [{ amount: 1, size: 8, type: 'Slashing' }],
      properties: [{ id: 10, name: 'Range', op_1_lvl: 0 }],
    }),
    item({
      id: 'a1',
      name: 'Chain Mail',
      type: 'armor',
      abilityRequirement: { name: 'Strength', level: 3 },
      properties: [
        { id: 1, name: 'Damage Reduction', op_1_lvl: 1 },
        { id: 5, name: 'Agility Reduction', op_1_lvl: 1 },
        { id: 22, name: 'Critical Range +1', op_1_lvl: 0 },
      ],
    }),
    item({
      id: 's1',
      name: 'Kite Shield',
      type: 'shield',
      properties: [{ id: 20, name: 'Shield Amount', op_1_lvl: 2 }],
    }),
    item({ id: 'e1', name: 'Rope', type: 'equipment' }),
  ];

  it('filters and counts by armament kind', () => {
    expect(filterItemsByArmamentKind(catalog, 'weapon').map((i) => i.id)).toEqual(['w1']);
    expect(countItemsByArmamentKind(catalog, 'armor')).toBe(1);
    expect(countItemsByArmamentKind(catalog, 'shield')).toBe(1);
    expect(countItemsByArmamentKind(catalog, 'weapon')).toBe(1);
  });

  it('weapon row columns match header keys (except name and actions)', () => {
    const rows = buildOfficialItemRows(catalog, propertiesDb, 'weapon');
    const row = rows[0]!;
    const headerKeys = ARMAMENT_LIBRARY_CONFIG.weapon.headers
      .filter((c) => c.key !== 'name')
      .map((c) => c.key);
    expect(Object.keys(row).filter((k) => headerKeys.includes(k))).toEqual(headerKeys);
    expect(armamentRowColumns(row, 'weapon').length).toBe(headerKeys.length);
  });

  it('armor sort keys align with row fields and derive ability/crit columns', () => {
    const rows = buildOfficialItemRows(catalog, propertiesDb, 'armor');
    const row = rows[0]!;
    expect(row.damageReduction).toBe(2);
    expect(row.agilityReduction).toBe(2);
    expect(row.abilityRequirement).toBe('Strength 3+');
    expect(row.criticalRangeIncrease).toBe(1);
    expect(row.parts.some((p) => /critical range/i.test(p.name))).toBe(false);
    const headerKeys = ARMAMENT_LIBRARY_CONFIG.armor.headers
      .filter((c) => c.key !== 'name')
      .map((c) => c.key);
    expect(headerKeys).toEqual([
      'rarity',
      'currency',
      'tp',
      'damageReduction',
      'agilityReduction',
      'abilityRequirement',
      'criticalRangeIncrease',
    ]);
    const cols = armamentRowColumns(row, 'armor');
    expect(cols.map((c) => c.key)).toEqual([
      'rarity',
      'currency',
      'tp',
      'damageReduction',
      'agilityReduction',
      'abilityRequirement',
      'criticalRangeIncrease',
    ]);
    expect(cols.find((c) => c.key === 'criticalRangeIncrease')?.value).toBe('+1');
  });

  it('shield damage column reads stored dice when there is no Shield Damage property (86e3jwwrt)', () => {
    const rows = buildOfficialItemRows(
      [
        item({
          id: 's-dmg',
          name: 'Buckler',
          type: 'shield',
          shieldDamage: { amount: 1, size: 4 },
          properties: [{ id: 39, name: 'Shield Amount', op_1_lvl: 0 }],
        }),
      ],
      propertiesDb,
      'shield',
    );
    expect(rows[0]?.damage).toBe('1d4 Bludgeoning');
    expect(armamentRowColumns(rows[0]!, 'shield').find((c) => c.key === 'damage')?.value).toBe(
      '1d4 Bludgeoning',
    );
  });

  it('shows a saved shieldDamage die instead of the property ladder (86e3jwwrt)', () => {
    const rows = buildOfficialItemRows(
      [
        item({
          id: 'saved-2d4',
          name: 'Tower Shield',
          type: 'shield',
          shieldDamage: { amount: 2, size: 4 },
          properties: [
            { id: 39, name: 'Shield Amount', op_1_lvl: 0 },
            { id: 40, name: 'Shield Damage', op_1_lvl: 2 },
          ],
        }),
        item({
          id: 'saved-1d10',
          name: 'Great Shield',
          type: 'shield',
          shieldDamage: { amount: 1, size: 10 },
          properties: [{ id: 40, name: 'Shield Damage', op_1_lvl: 3 }],
        }),
        item({
          id: 'property-only',
          name: 'Old Shield',
          type: 'shield',
          properties: [{ id: 40, name: 'Shield Damage', op_1_lvl: 2 }],
        }),
      ],
      propertiesDb,
      'shield',
    );
    expect(rows.find((row) => row.id === 'saved-2d4')?.damage).toBe('2d4 Bludgeoning');
    expect(rows.find((row) => row.id === 'saved-1d10')?.damage).toBe('1d10 Bludgeoning');
    expect(rows.find((row) => row.id === 'property-only')?.damage).toBe('1d8 Bludgeoning');
  });

  it('hides a leftover shield damage die when shield damage is off (86e3mmnz5)', () => {
    const rows = buildOfficialItemRows(
      [
        item({
          id: 'damage-off',
          name: 'Buckler',
          type: 'shield',
          hasShieldDamage: false,
          shieldDamage: { amount: 1, size: 6 },
          properties: [{ id: 39, name: 'Shield Amount', op_1_lvl: 0 }],
        }),
        item({
          id: 'damage-on',
          name: 'Spiked Shield',
          type: 'shield',
          hasShieldDamage: true,
          shieldDamage: { amount: 2, size: 4 },
          properties: [
            { id: 39, name: 'Shield Amount', op_1_lvl: 0 },
            { id: 40, name: 'Shield Damage', op_1_lvl: 2 },
          ],
        }),
      ],
      propertiesDb,
      'shield',
    );
    expect(rows.find((row) => row.id === 'damage-off')?.damage).toBe('-');
    expect(
      armamentRowColumns(rows.find((row) => row.id === 'damage-off')!, 'shield').find(
        (column) => column.key === 'damage',
      )?.value,
    ).toBe('-');
    expect(rows.find((row) => row.id === 'damage-on')?.damage).toBe('2d4 Bludgeoning');
  });

  it('shield rows expose block and damage columns', () => {
    const rows = buildOfficialItemRows(catalog, propertiesDb, 'shield');
    const row = rows[0]!;
    expect(row.block).not.toBe('-');
    const cols = armamentRowColumns(row, 'shield');
    expect(cols.map((c) => c.key)).toEqual(['rarity', 'currency', 'tp', 'block', 'damage']);
  });

  it('weapon Currency column is market cost, not the property C sum (TASK-870)', () => {
    const rows = buildOfficialItemRows(
      [
        item({
          id: 'axe',
          name: 'Axe',
          type: 'weapon',
          properties: [{ id: 1, name: 'Sharp', op_1_lvl: 0 }],
          costs: { totalCurrency: 2, totalIP: 2, totalTP: 4 },
        }),
      ],
      [
        {
          id: '1',
          name: 'Sharp',
          description: '',
          base_c: 2,
          op_1_c: 0,
          base_ip: 2,
          op_1_ip: 0,
          base_tp: 4,
        },
      ] as ItemProperty[],
      'weapon',
    );
    expect(rows[0]?.currency).toBe(31);
    expect(rows[0]?.currency).not.toBe(2);
    expect(rows[0]?.rarity).toBe('Common');
  });
});
