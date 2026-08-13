import { describe, expect, it } from 'vitest';
import { maxRarityForCharacterLevel, rarityAtOrBelowMax } from './creator-constants';

describe('maxRarityForCharacterLevel', () => {
  it('maps GAME_RULES level brackets', () => {
    expect(maxRarityForCharacterLevel(1)).toBe('Common');
    expect(maxRarityForCharacterLevel(4)).toBe('Common');
    expect(maxRarityForCharacterLevel(5)).toBe('Uncommon');
    expect(maxRarityForCharacterLevel(6)).toBe('Uncommon');
    expect(maxRarityForCharacterLevel(9)).toBe('Uncommon');
    expect(maxRarityForCharacterLevel(10)).toBe('Rare');
    expect(maxRarityForCharacterLevel(15)).toBe('Epic');
    expect(maxRarityForCharacterLevel(20)).toBe('Legendary');
    expect(maxRarityForCharacterLevel(25)).toBe('Mythic');
    expect(maxRarityForCharacterLevel(30)).toBe('Ascended');
    expect(maxRarityForCharacterLevel(40)).toBe('Ascended');
  });

  it('treats non-positive / non-finite levels as Common', () => {
    expect(maxRarityForCharacterLevel(0)).toBe('Common');
    expect(maxRarityForCharacterLevel(-3)).toBe('Common');
    expect(maxRarityForCharacterLevel(Number.NaN)).toBe('Common');
  });
});

describe('rarityAtOrBelowMax', () => {
  it('keeps Common + Uncommon when max is Uncommon', () => {
    expect(rarityAtOrBelowMax('Common', 'Uncommon')).toBe(true);
    expect(rarityAtOrBelowMax('Uncommon', 'Uncommon')).toBe(true);
    expect(rarityAtOrBelowMax('Rare', 'Uncommon')).toBe(false);
  });

  it('is case-insensitive and keeps blank/unknown rarities', () => {
    expect(rarityAtOrBelowMax('uncommon', 'Uncommon')).toBe(true);
    expect(rarityAtOrBelowMax('', 'Common')).toBe(true);
    expect(rarityAtOrBelowMax(null, 'Common')).toBe(true);
    expect(rarityAtOrBelowMax('Unique', 'Common')).toBe(true);
  });
});
