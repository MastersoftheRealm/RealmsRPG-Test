import { describe, expect, it } from 'vitest';
import {
  appendCreatureInventoryItems,
  collectCreatureInventoryItems,
  creatureInventoryQuantityMultiplier,
  formatCreatureEquipmentQuantity,
  normalizeCreatureInventoryType,
  removeCreatureInventoryItem,
  resolveCreatureInventoryBuckets,
  splitCreatureInventoryByKind,
} from './creature-inventory';

describe('normalizeCreatureInventoryType', () => {
  it('maps weapon / armor / shield and treats everything else as equipment', () => {
    expect(normalizeCreatureInventoryType('Weapon')).toBe('weapon');
    expect(normalizeCreatureInventoryType('ARMOR')).toBe('armor');
    expect(normalizeCreatureInventoryType('shield')).toBe('shield');
    expect(normalizeCreatureInventoryType('gear')).toBe('equipment');
    expect(normalizeCreatureInventoryType(undefined)).toBe('equipment');
  });
});

describe('resolveCreatureInventoryBuckets', () => {
  it('splits a legacy mixed armaments bag by type', () => {
    const buckets = resolveCreatureInventoryBuckets({
      armaments: [
        { id: 'w1', type: 'weapon', name: 'Axe' },
        { id: 'a1', type: 'armor', name: 'Mail' },
        { id: 's1', type: 'shield', name: 'Buckler' },
        { id: 'e1', type: 'kit', name: 'Torch' },
      ],
    });
    expect(buckets.weapons.map((i) => i.id)).toEqual(['w1']);
    expect(buckets.armor.map((i) => i.id)).toEqual(['a1']);
    expect(buckets.shields.map((i) => i.id)).toEqual(['s1']);
    expect(buckets.equipment.map((i) => i.id)).toEqual(['e1']);
  });

  it('prefers kind buckets even when a leftover armaments array exists', () => {
    const buckets = resolveCreatureInventoryBuckets({
      weapons: [{ id: 'w2', type: 'weapon', name: 'Sword' }],
      armor: [],
      shields: [],
      equipment: [{ id: 'e2', type: 'equipment', name: 'Rope' }],
      armaments: [{ id: 'stale', type: 'weapon', name: 'Stale' }],
    });
    expect(collectCreatureInventoryItems(buckets).map((i) => i.id)).toEqual(['w2', 'e2']);
  });
});

describe('split / append / remove', () => {
  it('appends into the matching bucket and removes by id across kinds', () => {
    const start = splitCreatureInventoryByKind([{ id: 'w1', type: 'weapon', name: 'Axe' }]);
    const next = appendCreatureInventoryItems(start, [
      { id: 'e1', type: 'equipment', name: 'Torch' },
    ]);
    expect(next.equipment).toHaveLength(1);
    expect(removeCreatureInventoryItem(next, 'w1').weapons).toEqual([]);
  });
});

describe('quantity display vs spend', () => {
  it('does not fake Qty 1 when quantity is missing', () => {
    expect(formatCreatureEquipmentQuantity(undefined)).toBe('-');
    expect(formatCreatureEquipmentQuantity(3)).toBe('3');
    expect(formatCreatureEquipmentQuantity(0)).toBe('0');
  });

  it('treats missing quantity as one item for spend', () => {
    expect(creatureInventoryQuantityMultiplier(undefined)).toBe(1);
    expect(creatureInventoryQuantityMultiplier(3)).toBe(3);
    expect(creatureInventoryQuantityMultiplier(0)).toBe(0);
  });
});
