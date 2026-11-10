/**
 * Expire listed public catalog caches after admin writes.
 *
 * Server Actions: `updateTag` (immediate data-cache miss; propagates to tagged CDN responses).
 * Route Handlers: `revalidateTag(tag, { expire: 0 })` (same, no stale body on the next GET).
 *
 * Purge only tags tied to the written slice (not the full codex CDN key) to stay under Vercel's
 * per-team per-second purge limit — full + all collections run only on source rename.
 */

import { revalidateTag, updateTag } from 'next/cache';
import {
  codexApiTableCacheTag,
  codexPublicCollectionCdnCacheTag,
  codexPublicFullCdnCacheTag,
  codexTableWriteCacheTags,
  CODEX_API_CACHE_TAG,
  CORE_RULES_CACHE_TAG,
  officialLibraryWriteCacheTags,
  officialPublicRouteCdnCacheTag,
} from '@/lib/codex/cache-tags';
import type { CodexCollection } from '@/lib/codex/collections';
import { codexCollectionToPayloadKey } from '@/lib/codex/collection-to-payload-key';
import type { CodexPayloadKey } from '@/types/codex';
import { CODEX_PAYLOAD_KEYS } from '@/types/codex';
import {
  codexListedPublicCdnTags,
  officialListedPublicCdnTags,
} from '@/lib/api/public-catalog-list-cache-tags';

const OFFICIAL_TABLE_TO_ROUTE_TYPE: Record<string, string> = {
  official_powers: 'powers',
  official_techniques: 'techniques',
  official_empowered_techniques: 'empowered-techniques',
  official_items: 'items',
  official_creatures: 'creatures',
  codex_species: 'species',
};

function uniqueTags(tags: Iterable<string>): string[] {
  return [...new Set(tags)];
}

function expireTagsFromServerAction(tags: Iterable<string>): void {
  for (const tag of uniqueTags(tags)) {
    updateTag(tag);
  }
}

function expireTagsFromRouteHandler(tags: Iterable<string>): void {
  for (const tag of uniqueTags(tags)) {
    revalidateTag(tag, { expire: 0 });
  }
}

function codexCollectionCdnTags(keys: readonly CodexPayloadKey[]): string[] {
  return keys.map((key) => codexPublicCollectionCdnCacheTag(key));
}

/** Tags expired after a codex collection write (strict superset of listed GET CDN tags). */
export function codexWritePurgeCacheTags(collection: CodexCollection, table: string): string[] {
  const payloadKey = codexCollectionToPayloadKey(collection);
  const tags = [
    ...codexTableWriteCacheTags(table),
    ...(collection === 'core_rules' ? [CORE_RULES_CACHE_TAG] : []),
    ...codexCollectionCdnTags([payloadKey]),
  ];
  if (collection === 'codex_archetypes') {
    tags.push(...codexTableWriteCacheTags('codex_archetype_levels'));
  }
  if (collection === 'codex_species') {
    tags.push(...officialLibraryWriteCacheTags('codex_species'));
    tags.push(officialPublicRouteCdnCacheTag('species'));
    tags.push(codexPublicCollectionCdnCacheTag('species'));
  }
  return uniqueTags(tags);
}

function codexSliceExpireTags(collection: CodexCollection, table: string): string[] {
  return codexWritePurgeCacheTags(collection, table);
}

/** After an admin codex table or core_rules write — listed public GETs must refresh on next request. */
export function invalidateCodexCollectionPublicCachesFromServerAction(
  collection: CodexCollection,
  table: string,
): void {
  expireTagsFromServerAction(codexSliceExpireTags(collection, table));
}

/** Source rename updates every codex table that carries `sources`. */
export function invalidateCodexApiAfterSourceRenameFromServerAction(
  tables: readonly string[],
): void {
  const tags: string[] = [CODEX_API_CACHE_TAG, codexPublicFullCdnCacheTag()];
  for (const table of tables) {
    tags.push(codexApiTableCacheTag(table));
  }
  tags.push(...codexCollectionCdnTags(CODEX_PAYLOAD_KEYS));
  expireTagsFromServerAction(tags);
}

/** Tags expired after an official-library write (strict superset of listed GET CDN tags). */
export function officialWritePurgeCacheTags(table: string): string[] {
  const tags = [...officialLibraryWriteCacheTags(table)];
  if (table === 'codex_species') {
    tags.push(...codexTableWriteCacheTags(table));
    tags.push(codexPublicCollectionCdnCacheTag('species'));
  }
  const routeType = OFFICIAL_TABLE_TO_ROUTE_TYPE[table];
  if (routeType) {
    tags.push(officialPublicRouteCdnCacheTag(routeType));
  }
  return uniqueTags(tags);
}

function officialWriteTags(table: string): string[] {
  return officialWritePurgeCacheTags(table);
}

/** After official library write inside a route handler. */
export function invalidateOfficialLibraryPublicCachesFromRouteHandler(table: string): void {
  expireTagsFromRouteHandler(officialWriteTags(table));
}

/** Tags attached to listed GET responses for this official table (for route-level freshness tests). */
export function officialListedGetCacheTags(table: string): string[] {
  const routeType = OFFICIAL_TABLE_TO_ROUTE_TYPE[table];
  if (!routeType) return [];
  return uniqueTags(officialListedPublicCdnTags(table, routeType));
}

/** Tags attached to listed GET responses for a codex collection (for route-level freshness tests). */
export function codexListedGetCacheTags(collection: CodexCollection): string[] {
  const payloadKey = codexCollectionToPayloadKey(collection);
  return uniqueTags(codexListedPublicCdnTags(new Set([payloadKey])));
}
