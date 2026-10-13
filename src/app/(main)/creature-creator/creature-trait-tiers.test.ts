import { describe, expect, it } from 'vitest';
import { MOVEMENT_TYPES, SENSES } from './creature-creator-constants';
import { replaceTieredCreatureTrait, TIERED_CREATURE_TRAIT_FAMILIES } from './creature-trait-tiers';

describe('replaceTieredCreatureTrait (86e3jx63c)', () => {
  it('replaces a lower Speedy tier and leaves other movement', () => {
    expect(replaceTieredCreatureTrait(['Hover', 'Speedy', 'Fly Half'], 'Speedy III')).toEqual([
      'Hover',
      'Fly Half',
      'Speedy III',
    ]);
  });

  it('replaces a higher tier when a lower one is chosen', () => {
    expect(replaceTieredCreatureTrait(['Darkvision III'], 'Darkvision')).toEqual(['Darkvision']);
  });

  it('replaces Flying half with full and does not duplicate Slow', () => {
    expect(replaceTieredCreatureTrait(['Fly Half', 'Slow'], 'Fly')).toEqual(['Slow', 'Fly']);
    expect(replaceTieredCreatureTrait(['Slow'], 'Slow')).toEqual(['Slow']);
  });

  it('only names traits that exist on the sense and movement lists', () => {
    const values = new Set([...SENSES, ...MOVEMENT_TYPES].map((option) => option.value));
    for (const family of TIERED_CREATURE_TRAIT_FAMILIES) {
      for (const name of family) {
        expect(values.has(name)).toBe(true);
      }
    }
  });
});
