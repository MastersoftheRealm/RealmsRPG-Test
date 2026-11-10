/**
 * Best-effort catalog cache purge after a committed write — purge failures must not fail the write.
 */

import { logApiError } from '@/lib/api-error';
import type { CodexCollection } from '@/lib/codex/collections';
import {
  invalidateCodexCollectionPublicCachesFromServerAction,
  invalidateOfficialLibraryPublicCachesFromRouteHandler,
} from './public-catalog-cache-invalidation';

export function purgeOfficialLibraryPublicCachesBestEffort(
  table: string,
  logContext: string,
): void {
  try {
    invalidateOfficialLibraryPublicCachesFromRouteHandler(table);
  } catch (err) {
    logApiError(logContext, err);
  }
}

export function purgeCodexCollectionPublicCachesBestEffort(
  collection: CodexCollection,
  table: string,
  logContext: string,
): void {
  try {
    invalidateCodexCollectionPublicCachesFromServerAction(collection, table);
  } catch (err) {
    logApiError(logContext, err);
  }
}
