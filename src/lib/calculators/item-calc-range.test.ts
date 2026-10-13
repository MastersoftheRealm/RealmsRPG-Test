import { describe, expect, it } from 'vitest';
import { PROPERTY_IDS } from '@/lib/id-constants';
import {
  deriveItemDisplay,
  deriveWeaponRangeConfig,
  formatRange,
  isMechanicProperty,
  resolveWeaponRangeDisplay,
  formatWeaponRangeDisplayCompact,
  weaponRangeSpaceLadder,
} from '@/lib/calculators/item-calc';
import type { ItemPropertyPayload } from '@/lib/calculators/item-calc';

describe('formatRange', () => {
  it('returns Melee when no Range property', () => {
    expect(formatRange([])).toBe('Melee');
    expect(formatRange([{ id: PROPERTY_IDS.TWO_HANDED, name: 'Two-Handed' }])).toBe('Melee');
  });

  it('derives spaces from Range op_1_lvl (8 base + 8 per level, cap 64)', () => {
    const level0: ItemPropertyPayload[] = [{ id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 0 }];
    const level1: ItemPropertyPayload[] = [{ id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 }];
    const level7: ItemPropertyPayload[] = [{ id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 7 }];
    expect(formatRange(level0)).toBe('8 spaces');
    expect(formatRange(level1)).toBe('16 spaces');
    expect(formatRange(level7)).toBe('64 spaces');
  });

  it('uses Thrown ladder (3 + 2 per level through mid-30s)', () => {
    expect(formatRange([{ id: PROPERTY_IDS.THROWN, name: 'Thrown', op_1_lvl: 0 }])).toBe(
      '3 spaces',
    );
    expect(formatRange([{ id: PROPERTY_IDS.THROWN, name: 'Thrown', op_1_lvl: 1 }])).toBe(
      '5 spaces',
    );
    expect(formatRange([{ id: PROPERTY_IDS.THROWN, name: 'Thrown', op_1_lvl: 16 }])).toBe(
      '35 spaces',
    );
  });

  it('uses Reach ladder (2–6 spaces)', () => {
    expect(formatRange([{ id: PROPERTY_IDS.REACH, name: 'Reach', op_1_lvl: 0 }])).toBe('2 spaces');
    expect(formatRange([{ id: PROPERTY_IDS.REACH, name: 'Reach', op_1_lvl: 2 }])).toBe('4 spaces');
    expect(formatRange([{ id: PROPERTY_IDS.REACH, name: 'Reach', op_1_lvl: 4 }])).toBe('6 spaces');
  });

  it('prefers Thrown over Range when both are present', () => {
    expect(
      formatRange([
        { id: PROPERTY_IDS.THROWN, name: 'Thrown', op_1_lvl: 0 },
        { id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 },
      ]),
    ).toBe('3 spaces');
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

describe('deriveItemDisplay damage', () => {
  it('formats typed dice+type rows through formatDamageDisplay', () => {
    const display = deriveItemDisplay(
      { name: 'Greatsword', damage: [{ amount: 1, size: 8, type: 'slashing' }] },
      [],
    );
    expect(display.damage).toBe('1d8 Slashing');
  });

  it('resolves range through the display SoT (Melee / spaces, never stored 0)', () => {
    const melee = deriveItemDisplay({ name: 'Club', properties: [] }, []);
    expect(melee.range).toBe('Melee');
    const ranged = deriveItemDisplay(
      {
        name: 'Longbow',
        properties: [{ id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 1 }],
      },
      [],
    );
    expect(ranged.range).toBe('16 spaces');
  });
});

describe('deriveWeaponRangeConfig', () => {
  it('restores melee when nothing is stored', () => {
    expect(deriveWeaponRangeConfig([])).toEqual({ type: 'melee', spaces: 0 });
  });

  it('restores ranged from legacy rangeLevel when properties have no range rows', () => {
    expect(deriveWeaponRangeConfig([], 2)).toEqual({ type: 'ranged', spaces: 16 });
    expect(deriveWeaponRangeConfig([], 1)).toEqual({ type: 'ranged', spaces: 8 });
  });

  it('ignores legacy rangeLevel when a Range property is present', () => {
    expect(
      deriveWeaponRangeConfig([{ id: PROPERTY_IDS.RANGE, name: 'Range', op_1_lvl: 0 }], 8),
    ).toEqual({ type: 'ranged', spaces: 8 });
  });
});

describe('weaponRangeSpaceLadder', () => {
  it('emits closed Reach / Thrown / Ranged ladders', () => {
    expect(weaponRangeSpaceLadder('reach')).toEqual([2, 3, 4, 5, 6]);
    expect(weaponRangeSpaceLadder('thrown')[0]).toBe(3);
    expect(weaponRangeSpaceLadder('thrown').at(-1)).toBe(35);
    expect(weaponRangeSpaceLadder('ranged')).toEqual([8, 16, 24, 32, 40, 48, 56, 64]);
  });
});

describe('isMechanicProperty range ids', () => {
  it('treats Thrown and Reach as mechanic even when the codex flag is false', () => {
    expect(isMechanicProperty({ id: PROPERTY_IDS.THROWN, name: 'Thrown', mechanic: false })).toBe(
      true,
    );
    expect(isMechanicProperty({ id: PROPERTY_IDS.REACH, name: 'Reach', mechanic: false })).toBe(
      true,
    );
    expect(isMechanicProperty({ id: PROPERTY_IDS.RANGE, name: 'Range' })).toBe(true);
    expect(isMechanicProperty({ id: PROPERTY_IDS.FINESSE, name: 'Finesse', mechanic: false })).toBe(
      true,
    );
    expect(isMechanicProperty({ id: PROPERTY_IDS.HEAVY, name: 'Heavy', mechanic: false })).toBe(
      true,
    );
  });
});
