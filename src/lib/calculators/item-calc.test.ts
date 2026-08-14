import { describe, expect, it } from 'vitest';
import { calculateCurrencyCostAndRarity } from './item-calc';

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
