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
        id: 'burst',
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
    expect(power.parts).toEqual([]);
    expect(power.composition?.structure).toBe('choice');
  });

  it('saves parts and composition so a later unmatched row can recompute', () => {
    const item = transformUserPowerToDisplayItem(
      {
        id: 'daze',
        docId: 'daze',
        name: 'Daze',
        description: '',
        parts: [{ id: 339, name: 'Daze', applyDuration: true }],
        actionType: 'quick',
        duration: { type: 'rounds', value: 2 },
        composition: {
          structure: 'modify',
          variants: [{ id: 'extra', label: 'Extra' }],
        },
      } as UserPower,
      [],
    );
    const power = displayItemToCreaturePower(item);
    expect(power.parts).toEqual([{ id: 339, name: 'Daze', applyDuration: true }]);
    expect(power.composition?.structure).toBe('modify');
    expect(power.actionType).toBe('quick');
    expect(power.durationValue).toEqual({ type: 'rounds', value: 2 });
    expect(power.action).toBeTruthy();
    expect(power.duration).toBeTruthy();
  });

  it('shows a partless power as its saved quick action and 2 rounds', () => {
    const item = transformUserPowerToDisplayItem(
      {
        id: 'glance',
        docId: 'glance',
        name: 'Glance',
        parts: [],
        actionType: 'quick',
        duration: { type: 'rounds', value: 2 },
      } as UserPower,
      [],
    );
    expect(item.stats?.find((stat) => stat.label === 'Action')?.value).toBe('Quick action');
    expect(item.details?.find((detail) => detail.label === 'Duration')?.value).toBe('2 Rounds');
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
