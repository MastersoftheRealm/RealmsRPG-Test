/**
 * Player creator name and description limits (86e3jx8ww).
 * Names stop at 100. Descriptions may be up to 10,000.
 */

export const CREATOR_NAME_MAX_LENGTH = 100;
export const CREATOR_DESCRIPTION_MAX_LENGTH = 10_000;

/** Show the description counter once it is this long. The name counter is always shown. */
export const CREATOR_DESCRIPTION_COUNTER_FROM = 9_000;

/** Same grouping as the paste notes ("10,000"), independent of the browser locale. */
export function formatCreatorTextCount(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatCreatorTextCounter(length: number, max: number): string {
  return `${formatCreatorTextCount(length)} of ${formatCreatorTextCount(max)} characters`;
}

export const CREATOR_NAME_TOO_LONG_MESSAGE = `Name must be ${formatCreatorTextCount(CREATOR_NAME_MAX_LENGTH)} characters or fewer.`;

export const CREATOR_DESCRIPTION_TOO_LONG_MESSAGE = `Description must be ${formatCreatorTextCount(CREATOR_DESCRIPTION_MAX_LENGTH)} characters or fewer.`;

export const CREATOR_NAME_TRUNCATED_MESSAGE = `Pasted name was shortened to ${formatCreatorTextCount(CREATOR_NAME_MAX_LENGTH)} characters.`;

export const CREATOR_DESCRIPTION_TRUNCATED_MESSAGE = `Pasted description was shortened to ${formatCreatorTextCount(CREATOR_DESCRIPTION_MAX_LENGTH)} characters.`;

export function clampCreatorText(
  value: string,
  max: number,
): { value: string; truncated: boolean } {
  if (value.length <= max) return { value, truncated: false };
  return { value: value.slice(0, max), truncated: true };
}

export function insertCreatorText(
  current: string,
  insert: string,
  selectionStart: number,
  selectionEnd: number,
  max: number,
): { value: string; truncated: boolean } {
  const length = current.length;
  const start = Math.min(Math.max(0, selectionStart), length);
  const end = Math.min(Math.max(start, selectionEnd), length);
  return clampCreatorText(current.slice(0, start) + insert + current.slice(end), max);
}
