/** Data Cache tags for public codex / rules reads (pair with `revalidateTag` on admin saves). */

import { CODEX_DETAIL_TABLE, type CodexDetailCollection } from '@/lib/codex/detail-href';

export const CODEX_DETAIL_CACHE_TAG = 'codex-detail';

export function codexDetailCollectionCacheTag(collection: string): string {
  return `${CODEX_DETAIL_CACHE_TAG}:${collection}`;
}

export const CODEX_API_CACHE_TAG = 'codex-api';

export function codexApiTableCacheTag(table: string): string {
  return `${CODEX_API_CACHE_TAG}:${table}`;
}

export const CORE_RULES_CACHE_TAG = 'core-rules';

export const OFFICIAL_LIBRARY_CACHE_TAG = 'official-library';

export function officialLibraryCacheTag(table: string, listedOnly: boolean): string {
  return `${OFFICIAL_LIBRARY_CACHE_TAG}:${table}:listedOnly=${listedOnly}`;
}

/** Invalidate memoized official-library reads after admin writes (listed + unlisted). */
export function officialLibraryWriteCacheTags(table: string): string[] {
  return [
    OFFICIAL_LIBRARY_CACHE_TAG,
    officialLibraryCacheTag(table, true),
    officialLibraryCacheTag(table, false),
  ];
}

const CODEX_TABLE_TO_DETAIL_COLLECTION = Object.fromEntries(
  Object.entries(CODEX_DETAIL_TABLE).map(([collection, table]) => [table, collection]),
) as Record<string, CodexDetailCollection>;

/** Invalidate detail pages + API slice after an admin codex table write. */
export function codexTableWriteCacheTags(table: string): string[] {
  const tags = [CODEX_API_CACHE_TAG, codexApiTableCacheTag(table), CODEX_DETAIL_CACHE_TAG];
  const collection = CODEX_TABLE_TO_DETAIL_COLLECTION[table];
  if (collection) tags.push(codexDetailCollectionCacheTag(collection));
  return tags;
}
