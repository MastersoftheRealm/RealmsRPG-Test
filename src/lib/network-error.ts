/**
 * Detect client-side failures where a save may not have reached the server.
 */

import { getErrorMessage, isApiError } from '@/lib/api-client';

export function isLikelyNetworkFailure(err: unknown): boolean {
  if (isApiError(err)) return false;
  if (
    typeof DOMException !== 'undefined' &&
    err instanceof DOMException &&
    err.name === 'AbortError'
  ) {
    return true;
  }
  if (err instanceof TypeError) return true;
  if (
    err &&
    typeof err === 'object' &&
    'name' in err &&
    (err as { name: string }).name === 'AbortError'
  ) {
    return true;
  }
  return /failed to fetch|networkerror|load failed|aborted/i.test(getErrorMessage(err, ''));
}
