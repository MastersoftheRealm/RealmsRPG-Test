/**
 * Theme-aware placeholder art paths and portrait fallbacks.
 * External SVG <img> tags cannot read page CSS variables — use light/dark asset pairs.
 */

export type ChoiceCardImageKind =
  | 'species'
  | 'creature'
  | 'path'
  | 'equipment'
  | 'power'
  | 'technique';

export type PlaceholderTheme = 'light' | 'dark';

const PLACEHOLDER_CARD_BY_KIND: Record<ChoiceCardImageKind, { light: string; dark: string }> = {
  species: {
    light: '/images/placeholder-species-card.svg',
    dark: '/images/placeholder-species-card-dark.svg',
  },
  creature: {
    light: '/images/placeholder-species-card.svg',
    dark: '/images/placeholder-species-card-dark.svg',
  },
  path: {
    light: '/images/placeholder-path-card.svg',
    dark: '/images/placeholder-path-card-dark.svg',
  },
  equipment: {
    light: '/images/placeholder-equipment-card.svg',
    dark: '/images/placeholder-equipment-card-dark.svg',
  },
  power: {
    light: '/images/placeholder-power-card.svg',
    dark: '/images/placeholder-power-card-dark.svg',
  },
  technique: {
    light: '/images/placeholder-technique-card.svg',
    dark: '/images/placeholder-technique-card-dark.svg',
  },
};

export function getPlaceholderCardArtPath(
  kind: ChoiceCardImageKind,
  theme: PlaceholderTheme = 'light',
): string {
  return PLACEHOLDER_CARD_BY_KIND[kind][theme];
}

/** Swap a light placeholder SVG path to its dark variant (list rows pass light paths from SSR helpers). */
export function getThemedPlaceholderSrc(src: string, theme: PlaceholderTheme): string {
  if (theme === 'light') return src;
  if (src.endsWith('-dark.svg')) return src;
  if (src.endsWith('.svg')) return src.replace(/\.svg$/, '-dark.svg');
  return src;
}

function buildFallbackPortraitDataUrl(bg: string, fg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-size="44" fill="${fg}" font-family="Arial,sans-serif">?</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Inline portrait placeholder — soft matte, not stark primary or pure black. */
export function getFallbackPortraitDataUrl(theme: PlaceholderTheme = 'light'): string {
  if (theme === 'dark') {
    return buildFallbackPortraitDataUrl('#21262d', '#8b949e');
  }
  return buildFallbackPortraitDataUrl('#e8f1f8', '#053357');
}
