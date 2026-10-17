import { describe, expect, it } from 'vitest';
import {
  CREATURE_SIZES,
  calculateCarryingCapacityKg,
  findSizeTableRow,
  reconcileSizeWithAllowedOptions,
} from './size-table';

/** Locked expectations for Kadin size table (Oct 2026). */
const SIZE_TABLE_EXPECTED = [
  {
    value: 'miniscule',
    baseCarry: 10,
    perStrCarry: 5,
    minCarry: 5,
    heightMinCm: null,
    heightMaxCm: 29,
    floorStrength: -5,
    floorCapacityKg: 5,
  },
  {
    value: 'tiny',
    baseCarry: 25,
    perStrCarry: 10,
    minCarry: 10,
    heightMinCm: 30,
    heightMaxCm: 59,
    floorStrength: -2,
    floorCapacityKg: 10,
  },
  {
    value: 'small',
    baseCarry: 50,
    perStrCarry: 25,
    minCarry: 25,
    heightMinCm: 60,
    heightMaxCm: 149,
    floorStrength: -2,
    floorCapacityKg: 25,
  },
  {
    value: 'medium',
    baseCarry: 100,
    perStrCarry: 50,
    minCarry: 50,
    heightMinCm: 150,
    heightMaxCm: 199,
    floorStrength: -2,
    floorCapacityKg: 50,
  },
  {
    value: 'large',
    baseCarry: 200,
    perStrCarry: 100,
    minCarry: 100,
    heightMinCm: 200,
    heightMaxCm: 299,
    floorStrength: -2,
    floorCapacityKg: 100,
  },
  {
    value: 'huge',
    baseCarry: 400,
    perStrCarry: 200,
    minCarry: 200,
    heightMinCm: 300,
    heightMaxCm: 449,
    floorStrength: -2,
    floorCapacityKg: 200,
  },
  {
    value: 'humongous',
    baseCarry: 800,
    perStrCarry: 400,
    minCarry: 400,
    heightMinCm: 450,
    heightMaxCm: 749,
    floorStrength: -2,
    floorCapacityKg: 400,
  },
  {
    value: 'gargantuan',
    baseCarry: 1600,
    perStrCarry: 800,
    minCarry: 800,
    heightMinCm: 750,
    heightMaxCm: null,
    floorStrength: -2,
    floorCapacityKg: 800,
  },
] as const;

describe('CREATURE_SIZES table', () => {
  it('matches locked base, step, minimum, and height bounds for all eight sizes', () => {
    expect(CREATURE_SIZES).toHaveLength(8);
    for (const expected of SIZE_TABLE_EXPECTED) {
      const row = CREATURE_SIZES.find((r) => r.value === expected.value);
      expect(row).toBeDefined();
      expect(row!.baseCarry).toBe(expected.baseCarry);
      expect(row!.perStrCarry).toBe(expected.perStrCarry);
      expect(row!.minCarry).toBe(expected.minCarry);
      expect(row!.heightMinCm).toBe(expected.heightMinCm);
      expect(row!.heightMaxCm).toBe(expected.heightMaxCm);
    }
  });
});

describe('calculateCarryingCapacityKg', () => {
  it('uses base carry at Strength 0 for every size', () => {
    for (const expected of SIZE_TABLE_EXPECTED) {
      expect(calculateCarryingCapacityKg(expected.value, 0)).toEqual({
        capacityKg: expected.baseCarry,
        minCarryKg: expected.minCarry,
      });
    }
  });

  it('floors at minimum carry for negative Strength (one case per size)', () => {
    for (const expected of SIZE_TABLE_EXPECTED) {
      expect(calculateCarryingCapacityKg(expected.value, expected.floorStrength)).toEqual({
        capacityKg: expected.floorCapacityKg,
        minCarryKg: expected.minCarry,
      });
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

  it('keeps the current pick when allowed sizes are unknown (empty catalog)', () => {
    expect(reconcileSizeWithAllowedOptions('Large', [])).toBe('Large');
    expect(reconcileSizeWithAllowedOptions(undefined, [])).toBeUndefined();
  });
});
