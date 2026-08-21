import { describe, expect, it } from 'vitest';
import type { Character } from '@/types';
import {
  applyArmamentFilters,
  countActiveArmamentFilters,
  EMPTY_ARMAMENT_FILTERS,
} from '@/lib/library/armament-filters';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';
import { deriveArmamentCharacterContext } from '@/lib/library/armament-character-context';

const ctx: ArmamentCharacterContext = {
  abilities: {
    strength: 2,
    agility: 0,
    vitality: 0,
    acuity: 0,
    intelligence: 0,
    charisma: 0,
  },
  armamentMax: 8,
  currency: 50,
  level: 6,
};

describe('armament-filters', () => {
  const rows = [
    { name: 'Light', tp: 3, currency: 20, rarity: 'Common', abilityReq: null },
    { name: 'Heavy', tp: 12, currency: 40, rarity: 'Common', abilityReq: null },
    {
      name: 'StrReq',
      tp: 4,
      currency: 30,
      rarity: 'Uncommon',
      abilityReq: { name: 'Strength', level: 3 },
    },
    { name: 'Expensive', tp: 2, currency: 80, rarity: 'Rare', abilityReq: null },
  ];

  it('filters by ability requirement and armament TP max when character set', () => {
    const filtered = applyArmamentFilters(rows, EMPTY_ARMAMENT_FILTERS, ctx);
    expect(filtered.map((r) => r.name)).toEqual(['Light', 'Expensive']);
  });

  it('optionally filters by currency', () => {
    const filtered = applyArmamentFilters(
      rows,
      { ...EMPTY_ARMAMENT_FILTERS, affordableCurrencyOnly: true },
      ctx,
    );
    expect(filtered.map((r) => r.name)).toEqual(['Light']);
  });

  it('applies min/max currency without a character', () => {
    const filtered = applyArmamentFilters(
      rows,
      { ...EMPTY_ARMAMENT_FILTERS, minCurrency: 25, maxCurrency: 50 },
      null,
    );
    expect(filtered.map((r) => r.name)).toEqual(['Heavy', 'StrReq']);
  });

  it('optionally keeps rarities at or below the character level bracket', () => {
    const filtered = applyArmamentFilters(
      rows,
      { ...EMPTY_ARMAMENT_FILTERS, rarityAccessibleOnly: true },
      ctx,
    );
    // Level 6 → Uncommon: Common + Uncommon. Armament profile still drops Heavy (TP) and StrReq (ability).
    expect(filtered.map((r) => r.name)).toEqual(['Light']);
  });

  it('equipment profile skips ability and TP gates', () => {
    const filtered = applyArmamentFilters(
      rows,
      { ...EMPTY_ARMAMENT_FILTERS, rarityAccessibleOnly: true },
      ctx,
      'equipment',
    );
    expect(filtered.map((r) => r.name)).toEqual(['Light', 'Heavy', 'StrReq']);
  });

  it('passes all rows when no character context and no currency range', () => {
    expect(
      applyArmamentFilters(rows, { ...EMPTY_ARMAMENT_FILTERS, affordableCurrencyOnly: true }, null),
    ).toHaveLength(4);
  });

  it('counts active filters', () => {
    expect(countActiveArmamentFilters(EMPTY_ARMAMENT_FILTERS, false)).toBe(0);
    expect(countActiveArmamentFilters(EMPTY_ARMAMENT_FILTERS, true)).toBe(1);
    expect(
      countActiveArmamentFilters({ ...EMPTY_ARMAMENT_FILTERS, affordableCurrencyOnly: true }, true),
    ).toBe(2);
    expect(
      countActiveArmamentFilters(
        { ...EMPTY_ARMAMENT_FILTERS, minCurrency: 0, maxCurrency: 10, rarityAccessibleOnly: true },
        true,
      ),
    ).toBe(4);
  });
});

describe('deriveArmamentCharacterContext', () => {
  it('maps martial prof to armament max and currency', () => {
    const character = {
      id: 'c1',
      name: 'Test',
      level: 1,
      mart_prof: 1,
      currency: 120,
      abilities: { strength: 3, agility: 1, vitality: 0, acuity: 0, intelligence: 0, charisma: 0 },
    } satisfies Character;
    const derived = deriveArmamentCharacterContext(character);
    expect(derived.armamentMax).toBe(8);
    expect(derived.currency).toBe(120);
    expect(derived.level).toBe(1);
    expect(derived.abilities.strength).toBe(3);
  });
});
