/**
 * Purge Next.js Data Cache and Vercel CDN entries for public catalog GETs after admin writes.
 * Use `revalidateTag(tag, 'max')` (not `updateTag`) on Next.js 16 so CDN entries invalidate.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import {
  codexApiTableCacheTag,
  codexTableWriteCacheTags,
  CODEX_API_CACHE_TAG,
  CORE_RULES_CACHE_TAG,
  officialLibraryWriteCacheTags,
} from '@/lib/codex/cache-tags';
import type { CodexCollection } from '@/lib/codex/collections';
import { codexCollectionToPayloadKey } from '@/lib/codex/collection-to-payload-key';
import type { CodexPayloadKey } from '@/types/codex';
import { CODEX_PAYLOAD_KEYS } from '@/types/codex';

const OFFICIAL_TABLE_TO_ROUTE_TYPE: Record<string, string> = {
  official_powers: 'powers',
  official_techniques: 'techniques',
  official_empowered_techniques: 'empowered-techniques',
  official_items: 'items',
  official_creatures: 'creatures',
  codex_species: 'species',
};

function purgeCacheTags(tags: Iterable<string>): void {
  const seen = new Set<string>();
  for (const tag of tags) {
    if (seen.has(tag)) continue;
    seen.add(tag);
    revalidateTag(tag, 'max');
  }
}

function revalidateListedCodexApiPaths(keys: readonly CodexPayloadKey[]): void {
  revalidatePath('/api/codex');
  for (const key of keys) {
    revalidatePath(`/api/codex?collection=${key}`);
  }
}

/** After an admin codex table or core_rules write — listed public GETs must refresh on next request. */
export function invalidateCodexCollectionPublicCaches(
  collection: CodexCollection,
  table: string,
): void {
  const tags = [...codexTableWriteCacheTags(table)];
  if (collection === 'core_rules') {
    tags.push(CORE_RULES_CACHE_TAG);
  }
  purgeCacheTags(tags);
  const payloadKey = codexCollectionToPayloadKey(collection);
  revalidateListedCodexApiPaths([payloadKey]);
}

/** Archetype path saves touch archetypes and progression levels. */
export function invalidateCodexArchetypePathPublicCaches(): void {
  purgeCacheTags([
    ...codexTableWriteCacheTags('codex_archetypes'),
    ...codexTableWriteCacheTags('codex_archetype_levels'),
  ]);
  revalidateListedCodexApiPaths(['archetypes']);
}

/** Source rename updates every codex table that carries `sources`. */
export function invalidateCodexApiAfterSourceRename(tables: readonly string[]): void {
  const tags = new Set<string>([CODEX_API_CACHE_TAG]);
  for (const table of tables) {
    tags.add(codexApiTableCacheTag(table));
  }
  purgeCacheTags(tags);
  revalidateListedCodexApiPaths(CODEX_PAYLOAD_KEYS);
}

/** After official library columnar create/update/delete/listing patch. */
export function invalidateOfficialLibraryPublicCaches(table: string): void {
  const tags = [...officialLibraryWriteCacheTags(table)];
  if (table === 'codex_species') {
    tags.push(...codexTableWriteCacheTags(table));
  }
  purgeCacheTags(tags);
  const routeType = OFFICIAL_TABLE_TO_ROUTE_TYPE[table];
  if (routeType) {
    revalidatePath(`/api/official/${routeType}`);
  }
  if (table === 'codex_species') {
    revalidatePath('/api/codex?collection=species');
  }
}

export function invalidateOfficialEnhancedItemsPublicCaches(): void {
  revalidatePath('/api/official/enhanced-items');
}
