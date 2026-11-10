/**
 * Cache tags on listed public GET responses — shared with write-path purge lists so
 * freshness tests assert GET tags ⊆ write tags.
 */

import {
  CODEX_API_CACHE_TAG,
  CORE_RULES_CACHE_TAG,
  OFFICIAL_LIBRARY_CACHE_TAG,
  codexApiTableCacheTag,
  codexPublicCollectionCdnCacheTag,
  codexPublicFullCdnCacheTag,
  officialLibraryCacheTag,
  officialPublicRouteCdnCacheTag,
} from '@/lib/codex/cache-tags';
import type { CodexDataTable } from '@/lib/codex/codex-tables';
import { CODEX_PAYLOAD_KEYS, type CodexPayloadKey } from '@/types/codex';

/** Tables behind each codex payload slice (matches GET /api/codex `?collection=`). */
export const CODEX_PAYLOAD_KEY_TABLES: Record<CodexPayloadKey, readonly CodexDataTable[]> = {
  feats: ['codex_feats'],
  skills: ['codex_skills'],
  species: ['codex_species'],
  traits: ['codex_traits'],
  powerParts: ['codex_parts'],
  techniqueParts: ['codex_parts'],
  parts: ['codex_parts'],
  itemProperties: ['codex_properties'],
  equipment: ['codex_equipment'],
  archetypes: ['codex_archetypes', 'codex_archetype_levels'],
  creatureFeats: ['codex_creature_feats'],
  coreRules: [],
};

/** Data-cache tags for a codex payload key set (listed GET and slice writes share this core). */
export function codexPayloadCacheTags(keys: ReadonlySet<CodexPayloadKey>): string[] {
  const tags = new Set<string>([CODEX_API_CACHE_TAG]);
  for (const key of keys) {
    for (const table of CODEX_PAYLOAD_KEY_TABLES[key]) {
      tags.add(codexApiTableCacheTag(table));
    }
    if (key === 'coreRules') {
      tags.add(CORE_RULES_CACHE_TAG);
    }
  }
  return [...tags];
}

/** Tags attached to a listed public `GET /api/codex` response for the requested keys. */
export function codexListedPublicCdnTags(keys: ReadonlySet<CodexPayloadKey>): string[] {
  const tags = [...codexPayloadCacheTags(keys)];
  if (keys.size === CODEX_PAYLOAD_KEYS.length) {
    tags.push(codexPublicFullCdnCacheTag());
  } else {
    for (const key of keys) {
      tags.push(codexPublicCollectionCdnCacheTag(key));
    }
  }
  return tags;
}

/** Tags attached to a listed public `GET /api/official/[type]` response. */
export function officialListedPublicCdnTags(table: string, routeType: string): string[] {
  return [
    OFFICIAL_LIBRARY_CACHE_TAG,
    officialLibraryCacheTag(table, true),
    officialPublicRouteCdnCacheTag(routeType),
  ];
}
