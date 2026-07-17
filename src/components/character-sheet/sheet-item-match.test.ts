import { describe, expect, it } from 'vitest';
import { matchesSheetEquipmentItem } from './sheet-item-match';

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
