/**
 * Memoized whole-table reads for official_* library GET routes.
 */

import { columnarViewSelect, type ColumnarLibraryType } from '@/lib/library-columnar';
import { officialLibraryCacheTag } from '@/lib/codex/cache-tags';
import { CODEX_PUBLIC_ISR_SECONDS, readCachedPublicData } from '@/lib/supabase/cached-public-read';
import type { TypedSupabaseClient } from '@/lib/supabase/database';

const OFFICIAL_TABLE_BY_TYPE = {
  powers: 'official_powers',
  techniques: 'official_techniques',
  'empowered-techniques': 'official_empowered_techniques',
  items: 'official_items',
  creatures: 'official_creatures',
} as const;

type OfficialLibraryTable = (typeof OFFICIAL_TABLE_BY_TYPE)[ColumnarLibraryType];

const SPECIES_PUBLIC_SELECT =
  'id, name, description, type, sizes, skills, species_traits, ancestry_traits, flaws, characteristics, ave_hgt_cm, ave_wgt_kg, adulthood_lifespan, languages, source, image_id, image_url, catalog_listing, updated_at, is_starter';

export async function fetchOfficialColumnarRows(
  supabase: TypedSupabaseClient,
  type: ColumnarLibraryType,
  includeUnlisted: boolean,
): Promise<Record<string, unknown>[]> {
  const table: OfficialLibraryTable = OFFICIAL_TABLE_BY_TYPE[type];
  const columns = columnarViewSelect(type);
  const listedOnly = !includeUnlisted;
  const tag = officialLibraryCacheTag(table, listedOnly);
  return readCachedPublicData(
    ['official-library', table, columns, `listedOnly=${listedOnly}`],
    [tag, 'official-library'],
    CODEX_PUBLIC_ISR_SECONDS,
    async () => {
      const base = supabase.from(table).select(columns);
      const { data, error } = includeUnlisted
        ? await base
        : await base.eq('catalog_listing', 'listed');
      if (error) throw error;
      return (data ?? []) as unknown as Record<string, unknown>[];
    },
  );
}

export async function fetchOfficialSpeciesRows(
  supabase: TypedSupabaseClient,
  includeUnlisted: boolean,
): Promise<Record<string, unknown>[]> {
  const listedOnly = !includeUnlisted;
  const tag = officialLibraryCacheTag('codex_species', listedOnly);
  return readCachedPublicData(
    ['official-library', 'codex_species', SPECIES_PUBLIC_SELECT, `listedOnly=${listedOnly}`],
    [tag, 'official-library'],
    CODEX_PUBLIC_ISR_SECONDS,
    async () => {
      const base = supabase.from('codex_species').select(SPECIES_PUBLIC_SELECT);
      const { data, error } = includeUnlisted
        ? await base
        : await base.eq('catalog_listing', 'listed');
      if (error) throw error;
      return (data ?? []) as unknown as Record<string, unknown>[];
    },
  );
}
