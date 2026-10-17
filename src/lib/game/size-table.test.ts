import { describe, expect, it } from 'vitest';
import {
  CREATURE_SIZES,
  calculateCarryingCapacityKg,
  findSizeTableRow,
  reconcileSizeWithAllowedOptions,
} from './size-table';

describe('calculateCarryingCapacityKg', () => {
  it('covers every size at Strength 0 with the table base values', () => {
    for (const row of CREATURE_SIZES) {
      const result = calculateCarryingCapacityKg(row.value, 0);
      expect(result).toEqual({ capacityKg: row.baseCarry, minCarryKg: row.minCarry });
    }
  });

  it('applies per-Strength steps at high Strength', () => {
    expect(calculateCarryingCapacityKg('medium', 4)).toEqual({
      capacityKg: 100 + 50 * 4,
      minCarryKg: 50,
    });
    expect(calculateCarryingCapacityKg('gargantuan', 2)).toEqual({
      capacityKg: 1600 + 800 * 2,
      minCarryKg: 800,
    });
  });

  it('floors at minimum carry with negative Strength (Tiny −2 → 10 kg)', () => {
    expect(calculateCarryingCapacityKg('tiny', -2)).toEqual({
      capacityKg: 10,
      minCarryKg: 10,
    });
    expect(calculateCarryingCapacityKg('miniscule', -5)).toEqual({
      capacityKg: 5,
      minCarryKg: 5,
    });
  });

  it('matches codex-style labels case-insensitively', () => {
    expect(calculateCarryingCapacityKg('Medium', 0)?.capacityKg).toBe(100);
    expect(findSizeTableRow('Minuscule')?.value).toBe('miniscule');
  });
});

describe('reconcileSizeWithAllowedOptions', () => {
  it('auto-picks when only one species size is allowed', () => {
    expect(reconcileSizeWithAllowedOptions('Large', ['Medium'])).toBe('Medium');
    expect(reconcileSizeWithAllowedOptions(undefined, ['Small'])).toBe('Small');
  });

  it('keeps a valid pick when still allowed', () => {
    expect(reconcileSizeWithAllowedOptions('Medium', ['Medium', 'Large'])).toBe('Medium');
    expect(reconcileSizeWithAllowedOptions('large', ['Medium', 'Large'])).toBe('Large');
  });

  it('clears a stale pick after species change leaves multiple options', () => {
    expect(reconcileSizeWithAllowedOptions('Huge', ['Medium', 'Large'])).toBeUndefined();
  });
});
