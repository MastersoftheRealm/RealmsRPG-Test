import { describe, expect, it } from 'vitest';
import { dedupeByNormalizedId, dedupeEntityRefs, dedupeSavedParts } from './dedupe-saved-parts';

describe('dedupeSavedParts', () => {
  it('collapses duplicate part ids and keeps first-seen order', () => {
    const parts = [
      { id: 10, name: 'Power Range', op_1_lvl: 0 },
      { id: 11, name: 'Magic Damage', op_1_lvl: 1 },
      { id: 10, name: 'Power Range', op_1_lvl: 0 },
      { id: '10', name: 'Power Range', op_1_lvl: 2 },
    ];
    expect(dedupeSavedParts(parts)).toEqual([
      { id: 10, name: 'Power Range', op_1_lvl: 2 },
      { id: 11, name: 'Magic Damage', op_1_lvl: 1 },
    ]);
  });

  it('falls back to name when id is missing', () => {
    const parts = [
      { name: 'Focus for Duration', op_1_lvl: 0 },
      { name: 'focus for duration', op_1_lvl: 1 },
    ];
    expect(dedupeSavedParts(parts)).toEqual([{ name: 'Focus for Duration', op_1_lvl: 1 }]);
  });

  it('handles string parts', () => {
    expect(dedupeSavedParts(['A', 'B', 'a'])).toEqual(['A', 'B']);
  });

  it('returns empty for null/undefined', () => {
    expect(dedupeSavedParts(null)).toEqual([]);
    expect(dedupeSavedParts(undefined)).toEqual([]);
  });
});

describe('dedupeEntityRefs', () => {
  it('dedupes power/technique/feat refs by id', () => {
    expect(
      dedupeEntityRefs([
        { id: 'p1', name: 'Bolt' },
        { id: 'P1', name: 'Bolt again' },
        { id: 'p2', name: 'Shield' },
      ])
    ).toEqual([
      { id: 'p1', name: 'Bolt' },
      { id: 'p2', name: 'Shield' },
    ]);
  });
});

describe('dedupeByNormalizedId', () => {
  it('keeps first and preserves items with empty keys', () => {
    expect(dedupeByNormalizedId(['a', 'A', '', 'b', ''], (x) => x)).toEqual(['a', '', 'b', '']);
  });
});
