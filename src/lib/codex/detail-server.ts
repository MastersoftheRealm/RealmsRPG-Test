/**
 * Server fetch for Codex detail pages (ADR-0021).
 * Cookie-less anon client so generateStaticParams / sitemap do not call cookies().
 */

import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public-client';
import { fromPublicTable, type PublicTableName } from '@/lib/supabase/database';
import {
  CODEX_DETAIL_COLLECTIONS,
  CODEX_DETAIL_TABLE,
  codexEntrySlug,
  parseCodexEntrySlug,
  type CodexDetailCollection,
} from '@/lib/codex/detail-href';

export type CodexDetailRow = {
  id: string;
  name: string;
  description: string;
};

const DETAIL_SELECT = 'id, name, description';

function toDetailRow(row: Record<string, unknown>): CodexDetailRow | null {
  const id = String(row.id ?? '');
  if (!id) return null;
  return {
    id,
    name: String(row.name ?? ''),
    description: typeof row.description === 'string' ? row.description : '',
  };
}

async function fetchCollectionRows(collection: CodexDetailCollection): Promise<CodexDetailRow[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const table = CODEX_DETAIL_TABLE[collection] as PublicTableName;
  const { data, error } = await fromPublicTable(supabase, table).select(DETAIL_SELECT);
  if (error || !data) return [];
  return (data as Record<string, unknown>[])
    .map((row) => toDetailRow(row))
    .filter((row): row is CodexDetailRow => row !== null);
}

const loadCodexDetailCollection = cache(fetchCollectionRows);

async function fetchCodexDetailEntry(
  collection: CodexDetailCollection,
  slug: string,
): Promise<CodexDetailRow | null> {
  const parsed = parseCodexEntrySlug(slug);
  if (!parsed) return null;
  const supabase = createPublicClient();
  if (!supabase) return null;
  const table = CODEX_DETAIL_TABLE[collection] as PublicTableName;
  const { data, error } = await fromPublicTable(supabase, table)
    .select(DETAIL_SELECT)
    .eq('id', parsed.id)
    .maybeSingle();
  if (error || !data) return null;
  return toDetailRow(data as Record<string, unknown>);
}

export const loadCodexDetailEntry = cache(fetchCodexDetailEntry);

export async function loadAllCodexDetailParams(): Promise<
  { collection: CodexDetailCollection; slug: string }[]
> {
  const batches = await Promise.all(
    CODEX_DETAIL_COLLECTIONS.map(async (collection) => {
      const rows = await loadCodexDetailCollection(collection);
      return rows.map((row) => ({
        collection,
        slug: codexEntrySlug(row.name, row.id),
      }));
    }),
  );
  return batches.flat();
}
