import { describe, expect, it } from 'vitest';
import { buildCustomEquipmentItem } from '@/components/character-sheet/add-library-item/build-custom-equipment';
import {
  appendCreatureInventoryItems,
  splitCreatureInventoryByKind,
} from '@/lib/game/creature-inventory';
import { customEquipmentItemToCreatureArmament } from './transformers';

describe('customEquipmentItemToCreatureArmament (DEV-V-016-T027 / TASK-816)', () => {
  it('maps a one-off Item into the equipment bucket without DisplayItem.sourceData', () => {
    const item = buildCustomEquipmentItem('  Rope  ', '  50 ft  ', 2);
    const armament = customEquipmentItemToCreatureArmament(item);

    expect(armament).toEqual({
      id: item.id,
      name: 'Rope',
      type: 'equipment',
      tp: 0,
      currency: 0,
      rarity: 'Common',
      quantity: 2,
      description: '50 ft',
    });

    const start = splitCreatureInventoryByKind([{ id: 'w1', type: 'weapon', name: 'Axe' }]);
    const next = appendCreatureInventoryItems(start, [armament]);
    expect(next.weapons).toHaveLength(1);
    expect(next.equipment).toEqual([armament]);
    expect(next.armor).toEqual([]);
    expect(next.shields).toEqual([]);
  });

  it('forces type equipment so the row cannot land in weapons/armor/shields', () => {
    const item = { ...buildCustomEquipmentItem('Torch'), type: 'weapon' as const };
    const armament = customEquipmentItemToCreatureArmament(item);
    expect(armament.type).toBe('equipment');
    const next = appendCreatureInventoryItems(splitCreatureInventoryByKind([]), [armament]);
    expect(next.weapons).toEqual([]);
    expect(next.equipment).toHaveLength(1);
  });
});
