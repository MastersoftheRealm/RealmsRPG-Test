import { describe, expect, it } from 'vitest';
import { applySheetEquipmentQuantityDelta, matchesSheetEquipmentItem } from './sheet-item-match';
import type { Item } from '@/types';

describe('matchesSheetEquipmentItem', () => {
  it('matches by id', () => {
    expect(matchesSheetEquipmentItem({ id: 'w1', name: 'Sword' }, 'w1', 0)).toBe(true);
    expect(matchesSheetEquipmentItem({ id: 12, name: 'Sword' }, 12, 0)).toBe(true);
  });

  it('matches by name (case-insensitive)', () => {
    expect(matchesSheetEquipmentItem({ name: 'Longsword' }, 'Longsword', 0)).toBe(true);
    expect(matchesSheetEquipmentItem({ name: 'Longsword' }, 'longsword', 0)).toBe(true);
  });

  it('matches by numeric index when id is a number', () => {
    expect(matchesSheetEquipmentItem({ name: 'A' }, 2, 2)).toBe(true);
    expect(matchesSheetEquipmentItem({ name: 'A' }, 2, 1)).toBe(false);
  });

  it('does not match unrelated rows', () => {
    expect(matchesSheetEquipmentItem({ id: 'a', name: 'Axe' }, 'b', 0)).toBe(false);
  });
});

describe('applySheetEquipmentQuantityDelta', () => {
  const bedRoll = { id: 'bed-roll', name: 'Bed Roll', type: 'equipment', quantity: 1 } as Item;

  it('keeps the row at quantity 0 instead of removing it', () => {
    const next = applySheetEquipmentQuantityDelta([bedRoll], 'bed-roll', -1);
    expect(next).toHaveLength(1);
    expect(next[0]?.quantity).toBe(0);
  });

  it('does not go below 0', () => {
    const atZero = { ...bedRoll, quantity: 0 };
    const next = applySheetEquipmentQuantityDelta([atZero], 'bed-roll', -1);
    expect(next[0]?.quantity).toBe(0);
  });
});
