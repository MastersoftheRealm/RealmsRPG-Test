import { describe, expect, it } from 'vitest';
import {
  calculateCurrencyCostAndRarity,
  deriveCriticalRangeIncreaseFromProperties,
  resolveItemMarketPricing,
  type ItemPropertyTpRow,
} from './item-calc';

/** Known property: C=2, IP=2 → Common market Currency 31, not the raw C sum. */
const SHARP: ItemPropertyTpRow = {
  id: 1,
  name: 'Sharp',
  base_c: 2,
  op_1_c: 0,
  base_ip: 2,
  op_1_ip: 0,
  base_tp: 4,
};

describe('calculateCurrencyCostAndRarity (T10 / M11)', () => {
  it('picks rarity from IP band boundaries', () => {
    expect(calculateCurrencyCostAndRarity(0, 4).rarity).toBe('Common');
    expect(calculateCurrencyCostAndRarity(0, 4.01).rarity).toBe('Uncommon');
    expect(calculateCurrencyCostAndRarity(0, 4.25).rarity).toBe('Uncommon');
    expect(calculateCurrencyCostAndRarity(0, 6).rarity).toBe('Uncommon');
    expect(calculateCurrencyCostAndRarity(0, 6.5).rarity).toBe('Rare');
    expect(calculateCurrencyCostAndRarity(0, 8).rarity).toBe('Rare');
    expect(calculateCurrencyCostAndRarity(0, 11).rarity).toBe('Epic');
    expect(calculateCurrencyCostAndRarity(0, 14).rarity).toBe('Legendary');
    expect(calculateCurrencyCostAndRarity(0, 16).rarity).toBe('Mythic');
    expect(calculateCurrencyCostAndRarity(0, 16.01).rarity).toBe('Ascended');
  });

  it('clamps high-c Uncommon currency inside the Uncommon band', () => {
    const priced = calculateCurrencyCostAndRarity(40, 5);
    expect(priced.rarity).toBe('Uncommon');
    expect(priced.currencyCost).toBe(499);
    expect(priced.currencyCost).toBeLessThan(500);
  });
});

describe('resolveItemMarketPricing (TASK-870)', () => {
  it('converts a known property set to rarity-multiplied Currency, not the C sum', () => {
    const pricing = resolveItemMarketPricing([{ id: 1, name: 'Sharp', op_1_lvl: 0 }], [SHARP]);
    const expected = calculateCurrencyCostAndRarity(2, 2).currencyCost;

    expect(pricing.totalCurrency).toBe(2);
    expect(pricing.totalIP).toBe(2);
    expect(pricing.totalTP).toBe(4);
    expect(pricing.rarity).toBe('Common');
    expect(pricing.currencyCost).toBe(expected);
    expect(pricing.currencyCost).toBe(31);
    expect(pricing.currencyCost).not.toBe(pricing.totalCurrency);
    expect(pricing.resolvedFromProperties).toBe(true);
  });

  it('converts stored C+IP sums when the Codex DB is not loaded', () => {
    const expected = calculateCurrencyCostAndRarity(2, 2).currencyCost;
    const pricing = resolveItemMarketPricing([], [], { totalCurrency: 2, totalIP: 2, totalTP: 4 });
    expect(pricing.currencyCost).toBe(expected);
    expect(pricing.currencyCost).not.toBe(2);
    expect(pricing.resolvedFromProperties).toBe(false);
  });

  it('does not invent Common-floor Currency when there is no cost signal', () => {
    const pricing = resolveItemMarketPricing([], []);
    expect(pricing.currencyCost).toBe(0);
    expect(pricing.resolvedFromProperties).toBe(false);
  });
});

describe('deriveCriticalRangeIncreaseFromProperties', () => {
  it('is 1 + op_1_lvl for Critical Range +1', () => {
    expect(
      deriveCriticalRangeIncreaseFromProperties([
        { id: 22, name: 'Critical Range +1', op_1_lvl: 0 },
      ]),
    ).toBe(1);
    expect(
      deriveCriticalRangeIncreaseFromProperties([{ name: 'Critical Range Increase', op_1_lvl: 2 }]),
    ).toBe(3);
  });

  it('returns 0 when the property is absent', () => {
    expect(deriveCriticalRangeIncreaseFromProperties([])).toBe(0);
    expect(
      deriveCriticalRangeIncreaseFromProperties([{ name: 'Agility Reduction', op_1_lvl: 1 }]),
    ).toBe(0);
  });
});
