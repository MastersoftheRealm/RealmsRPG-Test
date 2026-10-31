/** Small text helpers shared across guided-creator steps. */

/** Skip "See more" when truncation would hide less than ~6 words of copy. */
const MIN_HIDDEN_TO_TRUNCATE = 40;

function hiddenCharCount(full: string, preview: string): number {
  return full.trim().length - preview.trim().length;
}

/** Whether collapsed tagline + full body should offer See more (plain strings only). */
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
