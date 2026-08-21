/**
 * Generated Database aliases (ADR-0020).
 * Domain / API shapes stay in src/types/*.ts (Library*, Codex*, Campaign, …).
 * Row types for `.from('campaigns')` come from here — do not re-declare CampaignRow etc.
 *
 * JSONB writes go through `asDbJson` (domain objects are not structurally `Json`).
 * Variable table names go through `fromPublicTable` — supabase-js collapses a
 * `PublicTableName` union to `never` on insert/update.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json, TablesInsert, TablesUpdate } from '@/types/database.types';

export type {
  Database,
  Enums,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '@/types/database.types';

export type TypedSupabaseClient = SupabaseClient<Database>;
export type PublicTableName = keyof Database['public']['Tables'];

/** JSONB write boundary. Domain objects lack a string index signature. */
export function asDbJson(value: unknown): Json {
  return value as Json;
}

export function asDbInsert<T extends PublicTableName>(row: object): TablesInsert<T> {
  return row as TablesInsert<T>;
}

export function asDbInsertRows<T extends PublicTableName>(rows: object[]): TablesInsert<T>[] {
  return rows as TablesInsert<T>[];
}

export function asDbUpdate<T extends PublicTableName>(row: object): TablesUpdate<T> {
  return row as TablesUpdate<T>;
}

type DynamicError = { message: string; code?: string | undefined } | null;
type DynamicResult<T> = PromiseLike<{
  data: T;
  error: DynamicError;
  count?: number | null | undefined;
}>;

export type DynamicTableFilter<T = Record<string, unknown>[] | null> = DynamicResult<T> & {
  eq: (column: string, value: unknown) => DynamicTableFilter<T>;
  in: (column: string, values: readonly unknown[]) => DynamicTableFilter<T>;
  ilike: (column: string, pattern: string) => DynamicTableFilter<T>;
  is: (column: string, value: unknown) => DynamicTableFilter<T>;
  order: (column: string, options?: { ascending?: boolean | undefined }) => DynamicTableFilter<T>;
  limit: (n: number) => DynamicTableFilter<T>;
  select: (
    columns?: string,
    options?: { count?: 'exact' | undefined; head?: boolean | undefined },
  ) => DynamicTableFilter<T>;
  maybeSingle: () => DynamicTableFilter<Record<string, unknown> | null>;
  single: () => DynamicTableFilter<Record<string, unknown> | null>;
};

export type DynamicTableQuery = {
  select: (
    columns?: string,
    options?: { count?: 'exact' | undefined; head?: boolean | undefined },
  ) => DynamicTableFilter;
  insert: (row: Record<string, unknown> | Record<string, unknown>[]) => DynamicTableFilter;
  update: (row: Record<string, unknown>) => DynamicTableFilter;
  upsert: (
    row: Record<string, unknown> | Record<string, unknown>[],
    options?: { onConflict?: string | undefined },
  ) => DynamicTableFilter;
  delete: () => DynamicTableFilter;
};

/**
 * `.from()` when the table name is a variable. Table names stay checked against
 * `PublicTableName`; the builder is Record-shaped because a table union is `never`.
 */
export function fromPublicTable(
  client: TypedSupabaseClient,
  table: PublicTableName,
): DynamicTableQuery {
  return client.from(table) as unknown as DynamicTableQuery;
}
