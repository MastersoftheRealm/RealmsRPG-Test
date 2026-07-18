import { describe, expect, it } from 'vitest';
import {
  deriveArmorItemCombatStats,
  getEquippedArmorQuickRef,
  partDataToChips,
} from './library-list-helpers';
import type { PartData } from '@/components/shared';
import type { Item } from '@/types';

describe('partDataToChips (character sheet)', () => {
  it('uses expandable chips with TP cost label even when there are no options', () => {
    const parts: PartData[] = [
      {
        name: 'Strike',
        description: 'Deal damage.',
        tpCost: 3,
        category: 'cost',
      },
    ];

    const chips = partDataToChips(parts);
    expect(chips).toHaveLength(1);
    expect(chips[0].kind).toBe('expandable');
    expect(chips[0].costLabel).toBe('TP');
    expect(chips[0].cost).toBe(3);
    expect(chips[0].description).toContain('Deal damage.');
  });

  it('keeps expandable kind when option levels are present', () => {
    const parts: PartData[] = [
      {
        name: 'Focus',
        description: 'Concentrate.',
        tpCost: 1,
        options: [{ label: 'Option 1', level: 2, description: 'Better focus' }],
        optionLevels: { opt1: 2, opt2: 0, opt3: 0 },
      },
    ];

    const chips = partDataToChips(parts);
    expect(chips[0].kind).toBe('expandable');
    expect(chips[0].costLabel).toBe('TP');
    expect(chips[0].level).toBe(2);
  });
});

describe('deriveArmorItemCombatStats / getEquippedArmorQuickRef', () => {
  it('reads armorValue from enriched-style items (matches library DR column)', () => {
    const item = {
      id: 'a1',
      name: 'Mail',
      equipped: true,
      armorValue: 3,
      critRange: 1,
    } as Item;

    expect(deriveArmorItemCombatStats(item)).toEqual({
      damageReduction: 3,
      criticalRangeIncrease: 1,
    });
  });

  it('falls back to libraryItem scalars when top-level DR is missing', () => {
    const item = {
      id: 'a2',
      name: 'Hide',
      equipped: true,
      libraryItem: { armorValue: 2, criticalRangeIncrease: 0 },
    } as Item;

    expect(deriveArmorItemCombatStats(item).damageReduction).toBe(2);
  });

  it('aggregates equipped armor only and computes Critical Range from evasion', () => {
    const armor = [
      { id: 'eq', name: 'Plate', equipped: true, armorValue: 4 } as Item,
      { id: 'bag', name: 'Leather', equipped: false, armorValue: 1 } as Item,
    ];
    expect(getEquippedArmorQuickRef(armor, 12)).toEqual({
      damageReduction: 4,
      criticalRange: 22, // 12 + 10 + 0
    });
  });

  it('returns null when no armor is equipped', () => {
    expect(getEquippedArmorQuickRef([{ id: 'x', name: 'Mail', equipped: false } as Item], 10)).toBeNull();
  });
});
