/** Small text helpers shared across guided-creator steps. */

const DEFAULT_PREVIEW_LEN = 320;

/** Shorter preview for compact trait/feat cards (paired with line-clamp-6). */
export const COMPACT_PREVIEW_LEN = 240;

/** Skip "Read more" when truncation would hide less than ~6 words of copy. */
const MIN_HIDDEN_TO_TRUNCATE = 40;

function hiddenCharCount(full: string, preview: string): number {
  return full.trim().length - preview.trim().length;
}

function worthTruncating(full: string, preview: string): boolean {
  return hiddenCharCount(full, preview) >= MIN_HIDDEN_TO_TRUNCATE;
}

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
  const preview = cut.trimEnd();

  if (!worthTruncating(trimmed, preview)) {
    return { preview: trimmed, isTruncated: false };
  }

  return { preview, isTruncated: true };
}

/** Whether collapsed tagline + full body should offer Read more (plain strings only). */
export function shouldExpandTaglineBody(tagline: string, fullBody: string): boolean {
  const tag = tagline.trim();
  const full = fullBody.trim();
  if (!tag || !full || full === tag) return false;

  if (full.startsWith(tag)) {
    return hiddenCharCount(full, tag) >= MIN_HIDDEN_TO_TRUNCATE;
  }

  return hiddenCharCount(`${tag}\n\n${full}`, tag) >= MIN_HIDDEN_TO_TRUNCATE;
}

/** Title-case a single token (e.g. ability or size). */
export function titleCase(value: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}
