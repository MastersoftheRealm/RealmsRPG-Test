/**
 * Cached, mapped official-library GET payloads (mapping, image enrich, sort).
 */

import { officialLibraryCacheTag, OFFICIAL_LIBRARY_CACHE_TAG } from '@/lib/codex/cache-tags';
import { enrichRowsWithBankImageUrls } from '@/lib/entity-image-enrich-server';
import { rowToItem, rowToItemSpecies, type ColumnarLibraryType } from '@/lib/library-columnar';
import { parseCatalogListing } from '@/lib/library/catalog-listing';
import {
  CODEX_PUBLIC_ISR_SECONDS,
  readCachedPublicDataWhenValid,
} from '@/lib/supabase/cached-public-read';
import type { TypedSupabaseClient } from '@/lib/supabase/database';
import { fetchOfficialColumnarRows, fetchOfficialSpeciesRows } from '@/lib/official-library-server';

const OFFICIAL_TABLE_BY_TYPE = {
  powers: 'official_powers',
  techniques: 'official_techniques',
  'empowered-techniques': 'official_empowered_techniques',
  items: 'official_items',
  creatures: 'official_creatures',
} as const;

function sortLibraryItemsByName(items: Record<string, unknown>[]): void {
  items.sort((a, b) => {
    const na = String(a.name ?? '');
    const nb = String(b.name ?? '');
    return na.localeCompare(nb);
  });
}

function officialPayloadCacheTags(table: string, listedOnly: boolean): string[] {
  return [OFFICIAL_LIBRARY_CACHE_TAG, officialLibraryCacheTag(table, listedOnly)];
}

export async function fetchCachedOfficialSpeciesItems(
  supabase: TypedSupabaseClient,
  includeUnlisted: boolean,
): Promise<Record<string, unknown>[]> {
  const listedOnly = !includeUnlisted;
  return readCachedPublicDataWhenValid(
    ['official-api-payload', 'species', `listedOnly=${listedOnly}`],
    officialPayloadCacheTags('codex_species', listedOnly),
    CODEX_PUBLIC_ISR_SECONDS,
    async () => {
      const speciesRows = await fetchOfficialSpeciesRows(supabase, includeUnlisted);
      await enrichRowsWithBankImageUrls(supabase, speciesRows);
      const items = speciesRows.map((r) => {
        const item = rowToItemSpecies(r as Record<string, unknown>);
        (item as Record<string, unknown>)._source = 'official';
        (item as Record<string, unknown>).catalogListing = parseCatalogListing(r.catalog_listing);
        return item as Record<string, unknown>;
      });
      sortLibraryItemsByName(items);
      return items;
    },
    (items) => items.length > 0,
  );
}

export async function fetchCachedOfficialColumnarItems(
  supabase: TypedSupabaseClient,
  type: ColumnarLibraryType,
  includeUnlisted: boolean,
): Promise<Record<string, unknown>[]> {
  const table = OFFICIAL_TABLE_BY_TYPE[type];
  const listedOnly = !includeUnlisted;
  return readCachedPublicDataWhenValid(
    ['official-api-payload', type, `listedOnly=${listedOnly}`],
    officialPayloadCacheTags(table, listedOnly),
    CODEX_PUBLIC_ISR_SECONDS,
    async () => {
      const officialRows = await fetchOfficialColumnarRows(supabase, type, includeUnlisted);
      await enrichRowsWithBankImageUrls(supabase, officialRows);
      const items = officialRows.map(
        (r) => rowToItem(type, r, 'official') as Record<string, unknown>,
      );
      sortLibraryItemsByName(items);
      return items;
    },
    (items) => items.length > 0,
  );
}
