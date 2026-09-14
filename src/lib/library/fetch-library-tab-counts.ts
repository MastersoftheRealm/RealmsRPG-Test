/**
 * Server helper for GET /api/user/library/counts and GET /api/official/counts.
 */

import {
  countArmamentsFromTypes,
  EMPTY_LIBRARY_TAB_COUNTS,
  type LibraryTabCounts,
} from '@/lib/library/library-tab-counts';

type CountError = { message?: string | undefined; code?: string | undefined } | null;

type CountQueryResult<T> = {
  data: T | null;
  error: CountError;
  count?: number | null | undefined;
};

/** Thenable + chainable `.eq()` — matches the PostgREST builder used by both count routes. */
export type LibraryCountQuery<T> = PromiseLike<CountQueryResult<T>> & {
  eq: (column: string, value: string) => LibraryCountQuery<T>;
};

export type LibraryCountsClient = {
  from: (table: string) => {
    select: (
      columns: string,
      options?: { count?: 'exact' | undefined; head?: boolean | undefined },
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
  enhanced?: string | undefined;
};

function isMissingTable(error: CountError): boolean {
  if (!error) return false;
  return error.code === '42P01' || (error.message?.includes('does not exist') ?? false);
}

async function countRows(
  supabase: LibraryCountsClient,
  table: string,
  options?: { userId?: string | undefined; listedOnly?: boolean | undefined },
): Promise<number> {
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  if (options?.userId) query = query.eq('user_id', options.userId);
  if (options?.listedOnly) query = query.eq('catalog_listing', 'listed');
  const { count, error } = await query;
  if (error) {
    if (isMissingTable(error)) return 0;
    throw error;
  }
  return count ?? 0;
}

async function itemTypes(
  supabase: LibraryCountsClient,
  table: string,
  options?: { userId?: string | undefined; listedOnly?: boolean | undefined },
): Promise<Array<string | undefined>> {
  let query = supabase.from(table).select('type');
  if (options?.userId) query = query.eq('user_id', options.userId);
  if (options?.listedOnly) query = query.eq('catalog_listing', 'listed');
  const { data, error } = await query;
  if (error) {
    if (isMissingTable(error)) return [];
    throw error;
  }
  return ((data ?? []) as Array<{ type?: string | undefined }>).map((row) => row.type);
}

export function fetchLibraryTabCounts(
  supabase: LibraryCountsClient,
  tables: LibraryCountTables,
  userId?: string,
  listedOnly?: boolean,
): Promise<LibraryTabCounts> {
  const scope = { userId, listedOnly };
  return Promise.all([
    countRows(supabase, tables.powers, scope),
    countRows(supabase, tables.techniques, scope),
    countRows(supabase, tables.empoweredTechniques, scope),
    countRows(supabase, tables.creatures, scope),
    tables.enhanced ? countRows(supabase, tables.enhanced, scope) : Promise.resolve(0),
    itemTypes(supabase, tables.items, scope),
  ]).then(([powers, techniques, empoweredTechniques, creatures, enhanced, types]) => ({
    ...EMPTY_LIBRARY_TAB_COUNTS,
    powers,
    techniques,
    empoweredTechniques,
    creatures,
    enhanced,
    ...countArmamentsFromTypes(types),
  }));
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
