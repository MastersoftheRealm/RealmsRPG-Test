import { describe, expect, it } from 'vitest';
import { buildCustomEquipmentItem } from '@/components/character-sheet/add-library-item/build-custom-equipment';
import type { UserPower } from '@/hooks/use-user-library';
import {
  appendCreatureInventoryItems,
  splitCreatureInventoryByKind,
} from '@/lib/game/creature-inventory';
import {
  customEquipmentItemToCreatureArmament,
  displayItemToCreaturePower,
  transformUserPowerToDisplayItem,
} from './transformers';

describe('transformUserPowerToDisplayItem variants (86e3kfkc2)', () => {
  it('stores variant chips on the creature power so the row can expand', () => {
    const item = transformUserPowerToDisplayItem(
      {
        docId: 'burst',
        name: 'Burst',
        description: 'Cold.',
        parts: [],
        composition: {
          structure: 'choice',
          variants: [
            { id: 'fire', label: 'Fire', damage: [{ amount: 1, size: 10, type: 'fire' }] },
            { id: 'ice', label: 'Ice', damage: [{ amount: 1, size: 10, type: 'ice' }] },
          ],
        },
      } as UserPower,
      [],
    );
    const power = displayItemToCreaturePower(item);
    expect(power.variantLabel).toMatch(/Choice/);
    expect(power.variantChips?.map((chip) => chip.name)).toEqual(['Fire', 'Ice']);
  });
});

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
