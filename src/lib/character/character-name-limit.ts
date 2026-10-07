/**
 * Character name length (sheet save + API).
 * A name over this limit is rejected by `characterUpdateSchema`. If that name
 * stays on the local character, every later PATCH includes it and the server
 * rejects the whole body, so unrelated edits never persist.
 */

import { pickDirtyCharacterFields } from '@/lib/character/dirty-patch';

export const CHARACTER_NAME_MAX_LENGTH = 100;

/** Show the live counter once the name is this long. */
export const CHARACTER_NAME_COUNTER_FROM = 80;

export const CHARACTER_NAME_TOO_LONG_MESSAGE = 'Name must be 100 characters or fewer.';

export const CHARACTER_NAME_TRUNCATED_MESSAGE = 'Pasted name was shortened to 100 characters.';

export function isCharacterNameOverLimit(name: unknown): boolean {
  return typeof name === 'string' && name.length > CHARACTER_NAME_MAX_LENGTH;
}

export function clampCharacterNameInput(value: string): { value: string; truncated: boolean } {
  if (value.length <= CHARACTER_NAME_MAX_LENGTH) return { value, truncated: false };
  return { value: value.slice(0, CHARACTER_NAME_MAX_LENGTH), truncated: true };
}

/** Insert text at the selection, then stop at the name limit. */
export function insertCharacterNameText(
  current: string,
  insert: string,
  selectionStart: number,
  selectionEnd: number,
): { value: string; truncated: boolean } {
  const max = current.length;
  const start = Math.min(Math.max(0, selectionStart), max);
  const end = Math.min(Math.max(start, selectionEnd), max);
  return clampCharacterNameInput(current.slice(0, start) + insert + current.slice(end));
}

/**
 * Drop an over-limit name from a dirty patch and put the last saved name back
 * on the cleaned document. Other dirty fields stay in the patch.
 */
export function characterSaveWithoutOverlongName(
  cleaned: Record<string, unknown>,
  baseline: Record<string, unknown> | null | undefined,
): { cleaned: Record<string, unknown>; dirty: Record<string, unknown>; rejected: boolean } {
  const dirty = pickDirtyCharacterFields(cleaned, baseline);
  if (!isCharacterNameOverLimit(dirty.name)) {
    return { cleaned, dirty, rejected: false };
  }

  const nextCleaned = { ...cleaned };
  if (baseline && typeof baseline.name === 'string') nextCleaned.name = baseline.name;
  else delete nextCleaned.name;

  const nextDirty = pickDirtyCharacterFields(nextCleaned, baseline);
  if (isCharacterNameOverLimit(nextDirty.name)) delete nextDirty.name;
  return { cleaned: nextCleaned, dirty: nextDirty, rejected: true };
}
