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
};

describe('armament-filters', () => {
  const rows = [
    { name: 'Light', tp: 3, currency: 20, abilityReq: null },
    { name: 'Heavy', tp: 12, currency: 40, abilityReq: null },
    { name: 'StrReq', tp: 4, currency: 30, abilityReq: { name: 'Strength', level: 3 } },
    { name: 'Expensive', tp: 2, currency: 80, abilityReq: null },
  ];

  it('filters by ability requirement and armament TP max when character set', () => {
    const filtered = applyArmamentFilters(rows, EMPTY_ARMAMENT_FILTERS, ctx);
    expect(filtered.map((r) => r.name)).toEqual(['Light', 'Expensive']);
  });

  it('optionally filters by currency', () => {
    const filtered = applyArmamentFilters(
      rows,
      { affordableCurrencyOnly: true },
      ctx
    );
    expect(filtered.map((r) => r.name)).toEqual(['Light']);
  });

  it('passes all rows when no character context', () => {
    expect(applyArmamentFilters(rows, { affordableCurrencyOnly: true }, null)).toHaveLength(4);
  });

  it('counts active filters', () => {
    expect(countActiveArmamentFilters(EMPTY_ARMAMENT_FILTERS, false)).toBe(0);
    expect(countActiveArmamentFilters(EMPTY_ARMAMENT_FILTERS, true)).toBe(1);
    expect(countActiveArmamentFilters({ affordableCurrencyOnly: true }, true)).toBe(2);
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
    expect(derived.abilities.strength).toBe(3);
  });
});
