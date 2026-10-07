/**
 * Toast text when a creator library save fails (86e3jzfxy).
 * Updating a row that was deleted must not be described as a new save.
 */

import { isApiError, getErrorMessage } from '@/lib/api-client';
import {
  CREATOR_DESCRIPTION_TOO_LONG_MESSAGE,
  CREATOR_NAME_TOO_LONG_MESSAGE,
} from '@/lib/creator/creator-text-limits';

export const CREATOR_DELETED_ROW_MESSAGE =
  'This item was deleted. It was not saved as a new item.';

export function creatorLibrarySaveErrorMessage(
  err: unknown,
  options: { updatingExisting: boolean },
): string {
  if (options.updatingExisting && isApiError(err) && err.status === 404) {
    return CREATOR_DELETED_ROW_MESSAGE;
  }
  const message = getErrorMessage(err, 'Failed to save');
  if (message.includes(CREATOR_NAME_TOO_LONG_MESSAGE)) return CREATOR_NAME_TOO_LONG_MESSAGE;
  if (message.includes(CREATOR_DESCRIPTION_TOO_LONG_MESSAGE)) {
    return CREATOR_DESCRIPTION_TOO_LONG_MESSAGE;
  }
  return `Failed to save: ${message}`;
}
