import { describe, expect, it } from 'vitest';
import {
  collectCategoryFilterOptions,
  derivePartCategories,
  formatPartCategoriesColumn,
  powerHasDamageCategory,
  resolvePartCategoryList,
  withDamageCategory,
} from './power-technique-categories';

const partsDb = [
  { id: '1', name: 'Fire', category: 'Offense', mechanic: false },
  { id: '2', name: 'Ward', category: 'Defense', mechanic: false },
  { id: '3', name: 'Basic Action', category: 'Mechanic', mechanic: true },
  { id: '4', name: 'Blast', category: 'Offense', mechanic: false },
  { id: '5', name: 'Fog', category: 'Control', mechanic: false },
];

describe('derivePartCategories (TASK-673)', () => {
  it('collects unique non-mechanic categories in first-seen order', () => {
    expect(
      derivePartCategories(
        [{ id: '1' }, { id: '3' }, { id: '4' }, { id: '2' }, { id: '5' }],
        partsDb,
      ),
    ).toEqual(['Offense', 'Defense', 'Control']);
  });

  it('skips mechanic parts and empty categories', () => {
    expect(derivePartCategories([{ id: '3' }, { id: 'missing' }], partsDb)).toEqual([]);
  });

  it('uses saved category when DB miss but payload has category', () => {
    expect(
      derivePartCategories([{ id: 'x', category: 'Utility', mechanic: false }], partsDb),
    ).toEqual(['Utility']);
  });

  it('resolvePartCategoryList aligns per-part categories with payload fallback', () => {
    expect(
      resolvePartCategoryList([{ name: 'Custom Shift', category: 'Adaptation' }], partsDb),
    ).toEqual(['Adaptation']);
    expect(resolvePartCategoryList([{ id: '3' }], partsDb)).toEqual(['']);
  });

  it('formats column display', () => {
    expect(formatPartCategoriesColumn([])).toBe('—');
    expect(formatPartCategoriesColumn(['Offense', 'Utility'])).toBe('Offense, Utility');
  });

  it('adds Damage category when power has damage rows', () => {
    expect(
      withDamageCategory(['Charm'], powerHasDamageCategory([{ amount: 1, size: 8, type: 'ice' }])),
    ).toEqual(['Charm', 'Damage']);
    expect(withDamageCategory(['Damage'], true)).toEqual(['Damage']);
    expect(powerHasDamageCategory([{ amount: 1, size: 6, type: 'none' }])).toBe(false);
  });

  it('collects sorted unique filter options', () => {
    expect(
      collectCategoryFilterOptions([
        ['Offense', 'Utility'],
        ['Control', 'offense'],
      ]),
    ).toEqual(['Control', 'Offense', 'Utility']);
  });
});
