/**
 * Player creator name and description limits (86e3jx8ww).
 * Names use the character-name limit. Descriptions may be up to 10,000.
 * Clamp and insert live in `character-name-limit`.
 */

import {
  CHARACTER_NAME_MAX_LENGTH,
  CHARACTER_NAME_TOO_LONG_MESSAGE,
  CHARACTER_NAME_TRUNCATED_MESSAGE,
  clampTextToLength,
  insertTextToLength,
} from '@/lib/character/character-name-limit';

export const CREATOR_NAME_MAX_LENGTH = CHARACTER_NAME_MAX_LENGTH;
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

export const CREATOR_NAME_TOO_LONG_MESSAGE = CHARACTER_NAME_TOO_LONG_MESSAGE;

export const CREATOR_DESCRIPTION_TOO_LONG_MESSAGE = `Description must be ${formatCreatorTextCount(CREATOR_DESCRIPTION_MAX_LENGTH)} characters or fewer.`;

export const CREATOR_NAME_TRUNCATED_MESSAGE = CHARACTER_NAME_TRUNCATED_MESSAGE;

export const CREATOR_DESCRIPTION_TRUNCATED_MESSAGE = `Pasted description was shortened to ${formatCreatorTextCount(CREATOR_DESCRIPTION_MAX_LENGTH)} characters.`;

export function clampCreatorText(
  value: string,
  max: number,
): { value: string; truncated: boolean } {
  return clampTextToLength(value, max);
}

export function insertCreatorText(
  current: string,
  insert: string,
  selectionStart: number,
  selectionEnd: number,
  max: number,
): { value: string; truncated: boolean } {
  return insertTextToLength(current, insert, selectionStart, selectionEnd, max);
}
