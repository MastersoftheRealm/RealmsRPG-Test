/** Data Cache tags for codex detail SSG (invalidation wired in 86e3qpeaq). */

export const CODEX_DETAIL_CACHE_TAG = 'codex-detail';

export function codexDetailCollectionCacheTag(collection: string): string {
  return `${CODEX_DETAIL_CACHE_TAG}:${collection}`;
}
