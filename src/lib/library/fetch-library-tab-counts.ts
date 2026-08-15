/**
 * Server helper for GET /api/user/library/counts and GET /api/official/counts.
 */

import {
  countArmamentsFromTypes,
  EMPTY_LIBRARY_TAB_COUNTS,
  type LibraryTabCounts,
} from '@/lib/library/library-tab-counts';

type CountError = { message?: string; code?: string } | null;

type CountQueryResult<T> = {
  data: T | null;
  error: CountError;
  count?: number | null;
};

/** Thenable + `.eq()` — matches the PostgREST builder used by both count routes. */
export type LibraryCountQuery<T> = PromiseLike<CountQueryResult<T>> & {
  eq: (column: string, value: string) => PromiseLike<CountQueryResult<T>>;
};

export type LibraryCountsClient = {
  from: (table: string) => {
    select: (
      columns: string,
      options?: { count?: 'exact'; head?: boolean },
    ) => LibraryCountQuery<unknown>;
  };
};

/** Narrow the PostgREST client; passing SupabaseClient here overflows TS2589. */
export function asLibraryCountsClient(client: unknown): LibraryCountsClient {
  return client as LibraryCountsClient;
}

export type LibraryCountTables = {
  powers: string;
  techniques: string;
  empoweredTechniques: string;
  items: string;
  creatures: string;
  /** Omit on official — Enhanced is My Library only (ADR-0015). */
  enhanced?: string;
};

function isMissingTable(error: CountError): boolean {
  if (!error) return false;
  return error.code === '42P01' || (error.message?.includes('does not exist') ?? false);
}

async function countRows(
  supabase: LibraryCountsClient,
  table: string,
  userId?: string,
): Promise<number> {
  const query = supabase.from(table).select('id', { count: 'exact', head: true });
  const { count, error } = userId ? await query.eq('user_id', userId) : await query;
  if (error) {
    if (isMissingTable(error)) return 0;
    throw error;
  }
  return count ?? 0;
}

async function itemTypes(
  supabase: LibraryCountsClient,
  table: string,
  userId?: string,
): Promise<Array<string | undefined>> {
  const query = supabase.from(table).select('type');
  const { data, error } = userId ? await query.eq('user_id', userId) : await query;
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return ((data ?? []) as Array<{ type?: string }>).map((row) => row.type);
}

export async function fetchLibraryTabCounts(
  supabase: LibraryCountsClient,
  tables: LibraryCountTables,
  userId?: string,
): Promise<LibraryTabCounts> {
  const [powers, techniques, empoweredTechniques, creatures, enhanced, types] = await Promise.all([
    countRows(supabase, tables.powers, userId),
    countRows(supabase, tables.techniques, userId),
    countRows(supabase, tables.empoweredTechniques, userId),
    countRows(supabase, tables.creatures, userId),
    tables.enhanced ? countRows(supabase, tables.enhanced, userId) : Promise.resolve(0),
    itemTypes(supabase, tables.items, userId),
  ]);

  return {
    ...EMPTY_LIBRARY_TAB_COUNTS,
    powers,
    techniques,
    empoweredTechniques,
    creatures,
    enhanced,
    ...countArmamentsFromTypes(types),
  };
}

export const USER_LIBRARY_COUNT_TABLES: LibraryCountTables = {
  powers: 'user_powers',
  techniques: 'user_techniques',
  empoweredTechniques: 'user_empowered_techniques',
  items: 'user_items',
  creatures: 'user_creatures',
  enhanced: 'user_enhanced_items',
};

export const OFFICIAL_LIBRARY_COUNT_TABLES: LibraryCountTables = {
  powers: 'official_powers',
  techniques: 'official_techniques',
  empoweredTechniques: 'official_empowered_techniques',
  items: 'official_items',
  creatures: 'official_creatures',
};
