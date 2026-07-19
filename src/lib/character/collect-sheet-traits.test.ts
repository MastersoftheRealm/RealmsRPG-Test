import { describe, expect, it } from 'vitest';
import { collectSheetTraits } from './collect-sheet-traits';

describe('collectSheetTraits', () => {
  it('does not list species traits twice when also present in selectedTraits', () => {
    const rows = collectSheetTraits({
      speciesTraitsFromCodex: ['Darkvision', 'Keen Senses'],
      ancestry: {
        selectedTraits: ['Darkvision', 'Keen Senses', 'Ancestry Pick'],
        selectedFlaw: 'Arrogant',
        selectedCharacteristic: 'Curious',
      },
    });
    expect(rows.map((r) => r.name)).toEqual([
      'Darkvision',
      'Keen Senses',
      'Ancestry Pick',
      'Arrogant',
      'Curious',
    ]);
    expect(rows.find((r) => r.name === 'Darkvision')?.category).toBe('species');
    expect(rows.find((r) => r.name === 'Ancestry Pick')?.category).toBe('ancestry');
  });

  it('dedupes legacyTraits against species/ancestry', () => {
    const rows = collectSheetTraits({
      speciesTraitsFromCodex: ['Trait A'],
      ancestry: { selectedTraits: ['Trait B'] },
      legacyTraits: ['Trait A', { name: 'Trait B' }, 'Trait C'],
    });
    expect(rows.map((r) => r.name)).toEqual(['Trait A', 'Trait B', 'Trait C']);
  });
});
