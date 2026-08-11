import { describe, expect, it } from 'vitest';
import { PROPERTY_IDS } from '@/lib/id-constants';
import {
  formatRange,
  resolveWeaponRangeDisplay,
  formatWeaponRangeDisplayCompact,
} from '@/lib/calculators/item-calc';
import type { ItemPropertyPayload } from '@/lib/calculators/item-calc';

describe('formatRange', () => {
  it('returns Melee when no Range property', () => {
    expect(formatRange([])).toBe('Melee');
    expect(formatRange([{ id: PROPERTY_IDS.TWO_HANDED, name: 'Two-Handed' }])).toBe('Melee');
  });

  it('derives spaces from Range op_1_lvl (8 base + 8 per level)', () => {
    const level0: ItemPropertyPayload[] = [{ id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 0 }];
    const level1: ItemPropertyPayload[] = [{ id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 }];
    expect(formatRange(level0)).toBe('8 spaces');
    expect(formatRange(level1)).toBe('16 spaces');
  });
});

describe('resolveWeaponRangeDisplay', () => {
  const rangeLevel1: ItemPropertyPayload[] = [
    { id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 },
  ];

  it('prefers properties over corrupt stored range', () => {
    expect(resolveWeaponRangeDisplay('0', rangeLevel1)).toBe('16 spaces');
    expect(resolveWeaponRangeDisplay('1', rangeLevel1)).toBe('16 spaces');
    expect(resolveWeaponRangeDisplay('2', rangeLevel1)).toBe('16 spaces');
  });

  it('returns Melee when no Range property (never "0")', () => {
    expect(resolveWeaponRangeDisplay('0', [])).toBe('Melee');
    expect(resolveWeaponRangeDisplay('0', [{ name: 'Two-Handed' }])).toBe('Melee');
    expect(resolveWeaponRangeDisplay('-', [])).toBe('Melee');
    expect(resolveWeaponRangeDisplay(null, [])).toBe('Melee');
  });

  it('uses valid stored range when properties are absent', () => {
    expect(resolveWeaponRangeDisplay('16 spaces', null)).toBe('16 spaces');
    expect(resolveWeaponRangeDisplay('Melee', undefined)).toBe('Melee');
  });

  it('rejects bare integer stored values without properties', () => {
    expect(resolveWeaponRangeDisplay('1', [])).toBe('Melee');
    expect(resolveWeaponRangeDisplay('8', [])).toBe('Melee');
  });
});

describe('formatWeaponRangeDisplayCompact', () => {
  const rangeLevel1: ItemPropertyPayload[] = [
    { id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 },
  ];

  it('compacts resolved range for dense cells', () => {
    expect(formatWeaponRangeDisplayCompact('0', rangeLevel1)).toBe('16 sp');
    expect(formatWeaponRangeDisplayCompact(null, [])).toBe('Melee');
    expect(formatWeaponRangeDisplayCompact('0', [])).toBe('Melee');
    expect(formatWeaponRangeDisplayCompact('1', [])).toBe('Melee');
  });
});
