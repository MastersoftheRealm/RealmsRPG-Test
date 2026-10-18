/**
 * Live whole-table read for Admin > Sources.
 * Server-only: the page imports the pure helpers in `admin-source-list.ts`.
 */

import {
  compileCodexSourceCatalog,
  CODEX_SOURCE_TABLES,
  sourcesColumnMissing,
  type CodexSourceCatalogEntry,
} from '@/lib/codex/source-catalog';
import { fetchAllPostgrestPages } from '@/lib/codex/postgrest-pager';
import type {
  AdminCodexSourceRow,
  AdminCodexSourceRowsByTable,
} from '@/lib/codex/admin-source-list';
import { createPublicClient } from '@/lib/supabase/public-client';

const ADMIN_SOURCE_ROW_SELECT = 'id, name, sources, updated_at';

export type AdminCodexSourceRowsPayload = {
  rowsByTable: AdminCodexSourceRowsByTable;
  /** Compiled from this read, so section counts match the rows. */
  catalog: CodexSourceCatalogEntry[];
};

export async function loadAdminCodexSourceRows(): Promise<AdminCodexSourceRowsPayload> {
  const client = createPublicClient();
  if (!client) throw new Error('Database client unavailable');

  const rowsByTable: AdminCodexSourceRowsByTable = {};
  const reads = await Promise.all(
    CODEX_SOURCE_TABLES.map(async (table) => {
      try {
        const data = await fetchAllPostgrestPages<AdminCodexSourceRow>(async (from, to) =>
          client
            .from(table)
            .select(ADMIN_SOURCE_ROW_SELECT)
            .order('id', { ascending: true })
            .range(from, to),
        );
        return { table, data, error: null as { code?: string; message?: string } | null };
      } catch (error) {
        return { table, data: null, error: error as { code?: string; message?: string } };
      }
    }),
  );

  for (const { table, data, error } of reads) {
    if (error) {
      if (sourcesColumnMissing(error)) continue;
      throw error;
    }
    rowsByTable[table] = data ?? [];
  }
  return { rowsByTable, catalog: compileCodexSourceCatalog(rowsByTable) };
}
