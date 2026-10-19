/**
 * Memoized whole-table reads for official_* library GET routes.
 */

import {
  columnarViewSelect,
  speciesPublicSelect,
  type ColumnarLibraryType,
} from '@/lib/library-columnar';
import { officialLibraryCacheTag } from '@/lib/codex/cache-tags';
import {
  CODEX_PUBLIC_ISR_SECONDS,
  readCachedPublicDataWhenValid,
} from '@/lib/supabase/cached-public-read';
import type { TypedSupabaseClient } from '@/lib/supabase/database';

const OFFICIAL_TABLE_BY_TYPE = {
  powers: 'official_powers',
  techniques: 'official_techniques',
  'empowered-techniques': 'official_empowered_techniques',
  items: 'official_items',
  creatures: 'official_creatures',
} as const;

type OfficialLibraryTable = (typeof OFFICIAL_TABLE_BY_TYPE)[ColumnarLibraryType];

export async function fetchOfficialColumnarRows(
  supabase: TypedSupabaseClient,
  type: ColumnarLibraryType,
  includeUnlisted: boolean,
): Promise<Record<string, unknown>[]> {
  const table: OfficialLibraryTable = OFFICIAL_TABLE_BY_TYPE[type];
  const columns = columnarViewSelect(type);
  const listedOnly = !includeUnlisted;
  const tag = officialLibraryCacheTag(table, listedOnly);
  return readCachedPublicDataWhenValid(
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
    (rows) => rows.length > 0,
  );
}

export async function fetchOfficialSpeciesRows(
  supabase: TypedSupabaseClient,
  includeUnlisted: boolean,
): Promise<Record<string, unknown>[]> {
  const listedOnly = !includeUnlisted;
  const columns = speciesPublicSelect();
  const tag = officialLibraryCacheTag('codex_species', listedOnly);
  return readCachedPublicDataWhenValid(
    ['official-library', 'codex_species', columns, `listedOnly=${listedOnly}`],
    [tag, 'official-library'],
    CODEX_PUBLIC_ISR_SECONDS,
    async () => {
      const base = supabase.from('codex_species').select(columns);
      const { data, error } = includeUnlisted
        ? await base
        : await base.eq('catalog_listing', 'listed');
      if (error) throw error;
      return (data ?? []) as unknown as Record<string, unknown>[];
    },
    (rows) => rows.length > 0,
  );
}
