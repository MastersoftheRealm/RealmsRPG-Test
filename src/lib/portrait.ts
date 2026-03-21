/**
 * Portrait display helpers
 * Treat legacy placeholder path as "no portrait" so we never request it (avoids 404).
 */

/** Legacy path that may be stored in DB; we treat it as no portrait and use inline fallback. */
export const PLACEHOLDER_PORTRAIT_PATH = '/images/placeholder-portrait.png';

/** Inline SVG data URL for missing portrait — no network request, no 404. */
export const FALLBACK_PORTRAIT_DATA_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><rect width="100%" height="100%" fill="%23053357"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" font-size="44" fill="white" font-family="Arial">?</text></svg>';

/**
 * Returns the URL to use for portrait display.
 * If portrait is empty or the legacy placeholder path, returns the inline fallback so we never 404.
 */
export function getEffectivePortrait(portrait: string | null | undefined): string {
  if (!portrait || portrait.trim() === '') return FALLBACK_PORTRAIT_DATA_URL;
  if (portrait === PLACEHOLDER_PORTRAIT_PATH || portrait.endsWith('placeholder-portrait.png')) {
    return FALLBACK_PORTRAIT_DATA_URL;
  }
  return portrait;
}

/**
 * Convert a data URL (e.g. cropped JPEG from canvas) to a Blob without `fetch(dataUrl)`.
 * Some browsers choke on `fetch()` for large data URLs; this path is reliable for portrait upload.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (comma === -1 || !dataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL');
  }
  const header = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  const mimeMatch = /^data:([^;,]+)/.exec(header);
  const mime = mimeMatch?.[1]?.trim() || 'image/jpeg';
  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new Error('Invalid base64 in data URL');
  }
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
