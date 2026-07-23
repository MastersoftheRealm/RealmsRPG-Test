import { describe, expect, it } from 'vitest';
import {
  getFallbackPortraitDataUrl,
  getPlaceholderCardArtPath,
  getThemedPlaceholderSrc,
} from './placeholder-art';

describe('placeholder-art', () => {
  it('returns light and dark card placeholder paths', () => {
    expect(getPlaceholderCardArtPath('species', 'light')).toBe(
      '/images/placeholder-species-card.svg'
    );
    expect(getPlaceholderCardArtPath('species', 'dark')).toBe(
      '/images/placeholder-species-card-dark.svg'
    );
  });

  it('swaps placeholder SVG paths to dark variants', () => {
    expect(getThemedPlaceholderSrc('/images/placeholder-power-card.svg', 'dark')).toBe(
      '/images/placeholder-power-card-dark.svg'
    );
    expect(getThemedPlaceholderSrc('/images/placeholder-power-card.svg', 'light')).toBe(
      '/images/placeholder-power-card.svg'
    );
    expect(getThemedPlaceholderSrc('https://cdn.example/art.png', 'dark')).toBe(
      'https://cdn.example/art.png'
    );
  });

  it('uses soft matte portrait fallbacks per theme', () => {
    expect(getFallbackPortraitDataUrl('light')).toContain('%23e8f1f8');
    expect(getFallbackPortraitDataUrl('dark')).toContain('%2321262d');
  });
});
