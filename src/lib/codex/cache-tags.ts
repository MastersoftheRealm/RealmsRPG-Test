/** Data Cache tags for public codex / rules reads (pair with `updateTag` on admin saves). */

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

/** Invalidate codex API slice after an admin codex table write. */
export function codexTableWriteCacheTags(table: string): string[] {
  return [CODEX_API_CACHE_TAG, codexApiTableCacheTag(table)];
}
