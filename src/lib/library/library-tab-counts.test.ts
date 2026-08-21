import { describe, expect, it } from 'vitest';
import {
  countArmamentsFromTypes,
  EMPTY_LIBRARY_TAB_COUNTS,
  libraryTabCount,
} from '@/lib/library/library-tab-counts';

describe('countArmamentsFromTypes', () => {
  it('splits weapon / armor / shield via normalizeArmamentKind', () => {
    expect(
      countArmamentsFromTypes(['weapon', 'Armor', 'SHIELD', 'equipment', '', null, undefined]),
    ).toEqual({ weapons: 1, armor: 1, shields: 1 });
  });

  it('returns zeros for an empty list', () => {
    expect(countArmamentsFromTypes([])).toEqual({ weapons: 0, armor: 0, shields: 0 });
  });
});

describe('libraryTabCount', () => {
  it('maps page tab ids onto the ADR-0015 payload', () => {
    const counts = {
      ...EMPTY_LIBRARY_TAB_COUNTS,
      powers: 4,
      empoweredTechniques: 2,
      weapons: 7,
    };
    expect(libraryTabCount(counts, 'powers')).toBe(4);
    expect(libraryTabCount(counts, 'empowered-techniques')).toBe(2);
    expect(libraryTabCount(counts, 'weapons')).toBe(7);
    expect(libraryTabCount(undefined, 'powers')).toBeUndefined();
  });
});
