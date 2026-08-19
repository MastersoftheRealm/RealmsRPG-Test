import { describe, expect, it } from 'vitest';
import { mergeEquipmentIntoInventory } from '@/lib/game/skill-allocation';
import type { Item } from '@/types';
import { defined } from '@/lib/utils';

describe('mergeEquipmentIntoInventory (DEV-V-009-T022 / DEV-V-016-T006)', () => {
  it('stacks by id and adds quantities', () => {
    const existing: Item[] = [{ id: 'g1', name: 'Rations', type: 'equipment', quantity: 2 }];
    const next = mergeEquipmentIntoInventory(existing, [
      { id: 'g1', name: 'Rations', type: 'equipment', quantity: 3 },
    ]);
    expect(next).toHaveLength(1);
    expect(defined(next[0]).quantity).toBe(5);
  });

  it('stacks by case-insensitive name when ids differ', () => {
    const existing: Item[] = [{ id: 'custom-1', name: 'Torch', type: 'equipment', quantity: 1 }];
    const next = mergeEquipmentIntoInventory(existing, [
      { id: 'custom-2', name: 'torch', type: 'equipment', quantity: 2 },
    ]);
    expect(next).toHaveLength(1);
    expect(defined(next[0]).quantity).toBe(3);
  });

  it('appends unmatched custom equipment as a new row', () => {
    const existing: Item[] = [{ id: 'g1', name: 'Rations', type: 'equipment', quantity: 1 }];
    const next = mergeEquipmentIntoInventory(existing, [
      { id: 'c1', name: 'Lucky Coin', type: 'equipment', quantity: 1 },
    ]);
    expect(next).toHaveLength(2);
    expect(defined(next[1]).name).toBe('Lucky Coin');
    expect(defined(next[1]).quantity).toBe(1);
  });
});
