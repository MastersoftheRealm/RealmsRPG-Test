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
import { fetchAllPostgrestPages, type PostgrestRangePageResult } from '@/lib/codex/postgrest-pager';
import type {
  AdminCodexSourceRow,
  AdminCodexSourceRowsByTable,
} from '@/lib/codex/admin-source-list';
import type { CodexSourceTable } from '@/lib/codex/source-catalog';
import { createPublicClient } from '@/lib/supabase/public-client';

const ADMIN_SOURCE_ROW_SELECT_BASE = 'id, name, sources, updated_at';

const ADMIN_SOURCE_ROW_SELECT_BY_TABLE: Record<CodexSourceTable, string> = {
  codex_feats: `${ADMIN_SOURCE_ROW_SELECT_BASE}, feat_lvl`,
  codex_skills: ADMIN_SOURCE_ROW_SELECT_BASE,
  codex_species: `${ADMIN_SOURCE_ROW_SELECT_BASE}, type`,
  codex_traits: ADMIN_SOURCE_ROW_SELECT_BASE,
  codex_parts: `${ADMIN_SOURCE_ROW_SELECT_BASE}, type`,
  codex_properties: `${ADMIN_SOURCE_ROW_SELECT_BASE}, type`,
  codex_equipment: `${ADMIN_SOURCE_ROW_SELECT_BASE}, category`,
  codex_archetypes: `${ADMIN_SOURCE_ROW_SELECT_BASE}, type`,
  codex_creature_feats: `${ADMIN_SOURCE_ROW_SELECT_BASE}, feat_lvl`,
};

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
        const data = await fetchAllPostgrestPages<AdminCodexSourceRow>(async (from, to) => {
          const page = await client
            .from(table)
            .select(ADMIN_SOURCE_ROW_SELECT_BY_TABLE[table])
            .order('id', { ascending: true })
            .range(from, to);
          return page as PostgrestRangePageResult<AdminCodexSourceRow>;
        });
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
