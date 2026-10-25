import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  formatArmorConfigCollapsedSummary,
  formatItemCreatorRangeDisplay,
  formatPropertyHeaderCost,
  formatPropertyPerLevelCost,
  propertyPointTotal,
  RARITY_REFERENCE,
} from '@/app/(main)/item-creator/item-creator-helpers';
import { selectedPropertiesForArmament } from '@/app/(main)/item-creator/item-creator-property-options';

const helpersPath = path.join(import.meta.dirname, '(main)/item-creator/item-creator-helpers.tsx');
const workspacePath = path.join(
  import.meta.dirname,
  '(main)/item-creator/use-item-creator-workspace.ts',
);

describe('Rarity Reference wording and currency caps (86e3jww8g)', () => {
  it('names Item Point and shows the written currency ranges', () => {
    const source = readFileSync(helpersPath, 'utf8');
    expect(source).toContain('Item Point (IP) determines rarity');
    expect(source).not.toContain('Item Power');
    expect(RARITY_REFERENCE.map((row) => row.currencyRange)).toEqual([
      '0–99',
      '100–499',
      '500–1,499',
      '1,500–9,999',
      '10,000–49,999',
      '50,000–99,999',
      '100,000+',
    ]);
  });
});

describe('item creator range type and armor summary (86e3jww8f)', () => {
  it('names Reach, Ranged, and Thrown beside the distance', () => {
    expect(formatItemCreatorRangeDisplay('melee', 0)).toBe('Melee');
    expect(formatItemCreatorRangeDisplay('reach', 2)).toBe('Reach, 2 spaces');
    expect(formatItemCreatorRangeDisplay('ranged', 16)).toBe('Ranged, 16 spaces');
    expect(formatItemCreatorRangeDisplay('thrown', 3)).toBe('Thrown, 3 spaces');
  });

  it('omits a zero Agility Reduction from the collapsed armor header', () => {
    expect(formatArmorConfigCollapsedSummary(0, 0, 0)).toBe('DR 0, Crit +0');
    expect(formatArmorConfigCollapsedSummary(4, 2, 1)).toBe('DR 4, AGI -2, Crit +1');
    expect(formatArmorConfigCollapsedSummary(1, 0, 3)).not.toContain('AGI -0');
  });

  it('shows Item Point per level when that rate is not zero', () => {
    expect(formatPropertyPerLevelCost('IP', 1)).toBe('IP +1/level');
    expect(formatPropertyPerLevelCost('IP', -0.25)).toBe('IP -0.25/level');
    expect(formatPropertyPerLevelCost('TP', 0)).toBeNull();
    expect(formatPropertyPerLevelCost('C', '0')).toBeNull();
  });
});

describe('armament type switch keeps weapon properties (86e3jww8e)', () => {
  const graze = {
    property: { id: 28, name: 'Graze', type: 'weapon' as const },
    op_1_lvl: 2,
  };
  const plated = {
    property: { id: 19, name: 'Bludgeoning Vulnerability', type: 'armor' as const },
    op_1_lvl: 0,
  };

  it('hides a weapon property on armor without removing it from the stored list', () => {
    const stored = [graze, plated];
    expect(selectedPropertiesForArmament(stored, 'Armor')).toEqual([plated]);
    expect(selectedPropertiesForArmament(stored, 'Weapon')).toEqual([graze]);
    expect(stored).toEqual([graze, plated]);
  });

  it('does not replace the stored property list when the type changes', () => {
    const source = readFileSync(workspacePath, 'utf8');
    const start = source.indexOf('const changeArmamentType');
    const end = source.indexOf('const visibleProperties', start);
    const body = source.slice(start, end);
    expect(start).toBeGreaterThan(-1);
    expect(body).not.toContain('setSelectedProperties');
    expect(body).not.toContain('selectedPropertiesForArmament');
  });
});

describe('negative Item Point on a property card (86e3jww89)', () => {
  it('shows a negative Item Point total and hides zero Training Points and Currency', () => {
    const ip = propertyPointTotal(-0.25, -0.25, 1);
    expect(ip).toBe(-0.5);
    expect(formatPropertyHeaderCost('IP', ip)).toBe('IP: -0.5');
    expect(formatPropertyHeaderCost('IP', -0.25)).toBe('IP: -0.25');
    expect(formatPropertyHeaderCost('TP', 0)).toBeNull();
    expect(formatPropertyHeaderCost('C', 0)).toBeNull();
    expect(formatPropertyPerLevelCost('IP', -0.25)).toBe('IP -0.25/level');
    expect(formatPropertyPerLevelCost('TP', 0)).toBeNull();
    expect(formatPropertyPerLevelCost('C', 0)).toBeNull();
  });
});
