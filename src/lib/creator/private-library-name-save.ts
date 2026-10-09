/**
 * Private library save for an open row (86e3jp7e1, 86e3jzbkr).
 * A new name updates that row. A different existing name asks before replace.
 * No open row creates a new item.
 */

import { getErrorMessage } from '@/lib/api-client';
import {
  CREATOR_DESCRIPTION_TOO_LONG_MESSAGE,
  CREATOR_NAME_TOO_LONG_MESSAGE,
} from '@/lib/creator/creator-text-limits';

export type PrivateLibraryNameSave =
  | { kind: 'create' }
  | { kind: 'update'; id: string }
  | { kind: 'confirm-replace'; id: string; matchCount: number };

function readLibraryId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const id = value.trim();
  return id.length > 0 ? id : null;
}

/** User-library id from a loaded creator row. Official rows are not user ids. */
export function libraryItemId(item: unknown): string | null {
  if (!item || typeof item !== 'object') return null;
  const row = item as { id?: unknown; docId?: unknown; _source?: unknown };
  if (row._source === 'official') return null;
  return readLibraryId(row.id) ?? readLibraryId(row.docId);
}

/**
 * `matchIds` are user-library rows whose name matches the save (case-insensitive).
 * `loadedId` is the row open in the creator, if any.
 */
export function decidePrivateLibraryNameSave(
  matchIds: readonly string[],
  loadedId: string | null,
): PrivateLibraryNameSave {
  const ids = matchIds.map((id) => id.trim()).filter((id) => id.length > 0);
  if (loadedId && (ids.length === 0 || ids.includes(loadedId))) {
    return { kind: 'update', id: loadedId };
  }
  const other = ids[0];
  if (!other) return { kind: 'create' };
  return { kind: 'confirm-replace', id: other, matchCount: ids.length };
}

/** Same text as a failed creator save toast. */
export function creatorSaveFailureText(err: unknown): string {
  const message = getErrorMessage(err, 'Failed to save');
  if (message.includes(CREATOR_NAME_TOO_LONG_MESSAGE)) return CREATOR_NAME_TOO_LONG_MESSAGE;
  if (message.includes(CREATOR_DESCRIPTION_TOO_LONG_MESSAGE))
    return CREATOR_DESCRIPTION_TOO_LONG_MESSAGE;
  return `Failed to save: ${message}`;
}

/**
 * My library name lookup used by `handleSave`.
 * A throw becomes the save error toast. Official lookup is not this function.
 */
export async function readPrivateLibraryNameMatches(
  findMatches: () => Promise<ReadonlyArray<{ id: string }>>,
): Promise<{ ids: string[] } | { errorText: string }> {
  try {
    const rows = await findMatches();
    return { ids: rows.map((row) => row.id) };
  } catch (err) {
    return { errorText: creatorSaveFailureText(err) };
  }
}
