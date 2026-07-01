/** Small text helpers shared across guided-creator steps. */

const DEFAULT_PREVIEW_LEN = 160;

/** Shorter preview for compact trait/feat cards (paired with line-clamp-4). */
export const COMPACT_PREVIEW_LEN = 120;

/** Truncate at a word boundary — avoids cutting mid-word or mid-sentence for previews. */
export function truncateAtWord(
  text?: string | null,
  maxLen = DEFAULT_PREVIEW_LEN
): { preview: string; isTruncated: boolean } {
  if (!text) return { preview: '', isTruncated: false };
  const trimmed = text.trim();
  if (!trimmed) return { preview: '', isTruncated: false };
  if (trimmed.length <= maxLen) return { preview: trimmed, isTruncated: false };

  const slice = trimmed.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > 48 ? slice.slice(0, lastSpace) : slice.trimEnd();
  return { preview: cut.trimEnd(), isTruncated: true };
}

/** Title-case a single token (e.g. ability or size). */
export function titleCase(value: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}
