import { describe, expect, it } from 'vitest';
import {
  addAdvancedEquipmentToInventory,
  availableUnarmedProwessLevels,
  buildAdvancedEquipmentCatalog,
  computeAdvancedEquipmentProficiencyTp,
  computeUnarmedProwessTpCost,
  filterAdvancedEquipmentCatalog,
  filterPathRecommendedForPhase,
  isPathRecommendedItem,
  pathRecommendedMergeKey,
  recommendedItemsInInventory,
  removeAdvancedEquipmentFromInventory,
  replaceRecommendedInventory,
  resolvePathRecommendedEquipment,
  selectedItemsFromInventory,
  UNARMED_PROWESS_BASE_TP,
  UNARMED_PROWESS_UPGRADE_TP,
  type AdvancedEquipmentItem,
} from '@/lib/creator/advanced-equipment-catalog';
import {
  computeRemainingCurrency,
  computeSpentCurrency,
  computeStartingCurrency,
} from '@/lib/guided-creator/equipment-currency';
import { CHARACTER_STARTING_CURRENCY } from '@/stores/character-creator-store';
import type { CodexEquipmentItem } from '@/types/codex';
import type { LibraryItem } from '@/types/library';
import type { ItemPropertyTpRow } from '@/lib/calculators/item-calc';

const props: ItemPropertyTpRow[] = [
  { id: 1, name: 'Sharp', base_tp: 2, op_1_tp: 1, base_c: 1, op_1_c: 0, base_ip: 0, op_1_ip: 0 },
];

const sword: AdvancedEquipmentItem = {
  id: 'sword-1',
  name: 'Longsword',
  type: 'weapon',
  description: 'A blade',
  gold_cost: 40,
  currency: 40,
  properties: [],
  source: 'public',
};

const hideArmor: AdvancedEquipmentItem = {
  id: 'armor-1',
  name: 'Hide Armor',
  type: 'armor',
  description: 'Light armor',
  gold_cost: 30,
  currency: 30,
  properties: [],
  source: 'codex',
};

const rope: AdvancedEquipmentItem = {
  id: 'rope-1',
  name: 'Rope',
  type: 'equipment',
  description: '50 ft',
  gold_cost: 5,
  currency: 5,
  category: 'Adventuring',
  properties: ['Sharp'],
  source: 'codex',
};

describe('advanced-equipment-catalog currency / unarmed (TASK-596)', () => {
  it('computeStartingCurrency matches Advanced level-1 budget (DEV-V-001-T014)', () => {
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

  it('unarmed prowess TP and available levels', () => {
    expect(computeUnarmedProwessTpCost(0)).toBe(0);
    expect(computeUnarmedProwessTpCost(1)).toBe(UNARMED_PROWESS_BASE_TP);
    expect(computeUnarmedProwessTpCost(2)).toBe(
      UNARMED_PROWESS_BASE_TP + UNARMED_PROWESS_UPGRADE_TP
    );
    expect(availableUnarmedProwessLevels(1).map((l) => l.level)).toEqual([1]);
    expect(availableUnarmedProwessLevels(8).map((l) => l.level)).toEqual([1, 2, 3]);
  });
});

describe('buildAdvancedEquipmentCatalog', () => {
  it('merges user armaments, codex, and public rows with source tags', () => {
    const userItems = [
      {
        id: 'u1',
        docId: 'u1',
        name: 'My Axe',
        description: 'Custom',
        type: 'weapon' as const,
        properties: [{ id: 1, name: 'Sharp', op_1_lvl: 0 }],
        image_id: null,
        image_url: null,
      },
      {
        id: 'skip',
        docId: 'skip',
        name: 'Skip Gear',
        type: 'equipment' as const,
        properties: [],
      },
    ];
    const codex: CodexEquipmentItem[] = [
      {
        id: 'c1',
        name: 'Torch',
        type: 'equipment',
        description: 'Light',
        gold_cost: 1,
        currency: 1,
        properties: [],
        category: 'Tools',
      },
    ];
    const publicItems: LibraryItem[] = [
      {
        id: 'p1',
        docId: 'p1',
        name: 'Official Shield',
        description: 'Wood',
        type: 'shield',
        properties: [],
      },
    ];

    const catalog = buildAdvancedEquipmentCatalog({
      userItems,
      codexEquipment: codex,
      publicItems,
      itemProperties: props,
    });

    expect(catalog.find((i) => i.id === 'u1')?.source).toBe('library');
    expect(catalog.find((i) => i.id === 'u1')?.type).toBe('weapon');
    expect(catalog.find((i) => i.id === 'skip')).toBeUndefined();
    expect(catalog.find((i) => i.id === 'c1')?.source).toBe('codex');
    expect(catalog.find((i) => i.id === 'p1')?.type).toBe('weapon');
    expect(catalog.find((i) => i.id === 'p1')?.source).toBe('public');
  });
});

describe('path recommend + filter', () => {
  const catalog = [sword, hideArmor, rope];

  it('resolves path recommendations by id or name without duplicates', () => {
    const resolved = resolvePathRecommendedEquipment(
      catalog,
      [
        { id: 'sword-1', quantity: 1 },
        { id: 'Longsword', quantity: 2 },
      ],
      [{ id: 'rope-1', quantity: 4 }]
    );
    expect(resolved).toHaveLength(2);
    expect(resolved[0]).toEqual({ item: sword, quantity: 1 });
    expect(resolved[1]).toEqual({ item: rope, quantity: 4 });
  });

  it('filters path phase to weapon vs armor when Layer 1', () => {
    const recommended = [
      { item: sword, quantity: 1 },
      { item: hideArmor, quantity: 1 },
      { item: rope, quantity: 2 },
    ];
    expect(
      filterPathRecommendedForPhase(recommended, {
        pathMode: true,
        showFullEquipmentList: false,
        loadoutPhase: 'weapon',
      }).map((r) => r.item.id)
    ).toEqual(['sword-1']);
    expect(
      filterPathRecommendedForPhase(recommended, {
        pathMode: true,
        showFullEquipmentList: false,
        loadoutPhase: 'armor',
      }).map((r) => r.item.id)
    ).toEqual(['armor-1']);
    expect(
      filterPathRecommendedForPhase(recommended, {
        pathMode: true,
        showFullEquipmentList: true,
        loadoutPhase: 'weapon',
      })
    ).toHaveLength(3);
  });

  it('isPathRecommendedItem distinguishes armament vs equipment sets', () => {
    expect(isPathRecommendedItem(sword, new Set(['sword-1']), new Set())).toBe(true);
    expect(isPathRecommendedItem(rope, new Set(['sword-1']), new Set(['rope']))).toBe(true);
    expect(isPathRecommendedItem(rope, new Set(['sword-1']), new Set())).toBe(false);
  });
});

describe('filter + inventory helpers', () => {
  const catalog = [sword, hideArmor, rope];

  it('filters by tab, source, and search', () => {
    expect(
      filterAdvancedEquipmentCatalog(catalog, { activeTab: 'weapon', sourceFilter: 'all' }).map(
        (i) => i.id
      )
    ).toEqual(['sword-1']);
    expect(
      filterAdvancedEquipmentCatalog(catalog, {
        activeTab: 'equipment',
        sourceFilter: 'public',
      })
    ).toEqual([rope]);
    expect(
      filterAdvancedEquipmentCatalog(catalog, {
        activeTab: 'weapon',
        sourceFilter: 'my',
      })
    ).toEqual([]);
    expect(
      filterAdvancedEquipmentCatalog(catalog, {
        activeTab: 'equipment',
        searchTerm: '50',
      })
    ).toEqual([rope]);
  });

  it('selectedItemsFromInventory maps draft inventory', () => {
    expect(
      selectedItemsFromInventory([
        { id: 'sword-1', name: 'Longsword', type: 'weapon', cost: 40, quantity: 2, properties: [] },
      ])
    ).toEqual([
      {
        id: 'sword-1',
        name: 'Longsword',
        type: 'weapon',
        cost: 40,
        quantity: 2,
        damage: undefined,
        armor: undefined,
        properties: [],
      },
    ]);
  });

  it('add / remove / replace recommended inventory', () => {
    const added = addAdvancedEquipmentToInventory([], sword, 2, 200);
    expect(added).toEqual([
      expect.objectContaining({ id: 'sword-1', quantity: 2, cost: 40, type: 'weapon' }),
    ]);
    expect(addAdvancedEquipmentToInventory([], sword, 1, 30)).toBeNull();

    const stacked = addAdvancedEquipmentToInventory(added!, sword, 1, 120);
    expect(stacked?.[0].quantity).toBe(3);

    const decremented = removeAdvancedEquipmentFromInventory(stacked!, 'sword-1');
    expect(decremented[0].quantity).toBe(2);
    expect(removeAdvancedEquipmentFromInventory(decremented, 'sword-1')[0].quantity).toBe(1);
    expect(
      removeAdvancedEquipmentFromInventory(
        [{ id: 'sword-1', name: 'Longsword', type: 'weapon', cost: 40, quantity: 1 }],
        'sword-1'
      )
    ).toEqual([]);

    const replaced = replaceRecommendedInventory(
      [
        { id: 'sword-1', name: 'Longsword', type: 'weapon', cost: 40, quantity: 9 },
        { id: 'keep', name: 'Keep', type: 'equipment', cost: 1, quantity: 1 },
      ],
      [
        { item: sword, quantity: 1 },
        { item: rope, quantity: 4 },
      ]
    );
    expect(replaced.map((i) => `${i.id}:${i.quantity}`)).toEqual([
      'keep:1',
      'sword-1:1',
      'rope-1:4',
    ]);
  });

  it('recommendedItemsInInventory + merge key', () => {
    const recommended = [
      { item: sword, quantity: 1 },
      { item: rope, quantity: 2 },
    ];
    expect(
      recommendedItemsInInventory([{ id: 'sword-1', name: 'Longsword', quantity: 1 }], recommended).map(
        (r) => r.item.id
      )
    ).toEqual(['sword-1']);
    expect(pathRecommendedMergeKey('arch-1', recommended)).toBe('arch-1:sword-1:1|rope-1:2');
  });
});

describe('computeAdvancedEquipmentProficiencyTp', () => {
  it('returns limit from level + archetype ability and zero spend for empty loadout', () => {
    const summary = computeAdvancedEquipmentProficiencyTp({
      inventory: [],
      powers: [],
      techniques: [],
      abilities: { strength: 3, acuity: 2 },
      martAbil: 'strength',
      level: 1,
      itemPropertiesDb: props,
    });
    expect(summary.spent).toBe(0);
    expect(summary.limit).toBeGreaterThan(0);
    expect(summary.remaining).toBe(summary.limit);
  });
});
