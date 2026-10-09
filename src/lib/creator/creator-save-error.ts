/**
 * Toast text when a creator library save fails (86e3jzfxy).
 * Updating a row that was deleted must not be described as a new save.
 * Other failures use the same text as the My library name lookup.
 */

import { isApiError } from '@/lib/api-client';
import { creatorSaveFailureText } from '@/lib/creator/private-library-name-save';

export const CREATOR_DELETED_ROW_MESSAGE = 'This item was deleted. It was not saved as a new item.';

export function creatorLibrarySaveErrorMessage(
  err: unknown,
  options: { updatingExisting: boolean },
): string {
  if (options.updatingExisting && isApiError(err) && err.status === 404) {
    return CREATOR_DELETED_ROW_MESSAGE;
  }
  return creatorSaveFailureText(err);
}
