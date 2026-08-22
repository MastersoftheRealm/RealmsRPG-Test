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
  feat_lvl?: number | undefined;
};

const DETAIL_SELECT = 'id, name, description';

function detailSelectFor(collection: CodexDetailCollection): string {
  if (collection === 'feats' || collection === 'creature-feats') {
    return `${DETAIL_SELECT}, feat_lvl`;
  }
  return DETAIL_SELECT;
}

function toDetailRow(row: Record<string, unknown>, includeFeatLvl: boolean): CodexDetailRow | null {
  const id = String(row.id ?? '');
  if (!id) return null;
  const detail: CodexDetailRow = {
    id,
    name: String(row.name ?? ''),
    description: typeof row.description === 'string' ? row.description : '',
  };
  if (includeFeatLvl && row.feat_lvl != null) {
    const lvl = Number(row.feat_lvl);
    if (Number.isFinite(lvl) && lvl > 0) detail.feat_lvl = lvl;
  }
  return detail;
}

async function fetchCollectionRows(collection: CodexDetailCollection): Promise<CodexDetailRow[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const table = CODEX_DETAIL_TABLE[collection] as PublicTableName;
  const { data, error } = await fromPublicTable(supabase, table).select(
    detailSelectFor(collection),
  );
  if (error || !data) return [];
  const includeFeatLvl = collection === 'feats' || collection === 'creature-feats';
  return (data as Record<string, unknown>[])
    .map((row) => toDetailRow(row, includeFeatLvl))
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
    .select(detailSelectFor(collection))
    .eq('id', parsed.id)
    .maybeSingle();
  if (error || !data) return null;
  const includeFeatLvl = collection === 'feats' || collection === 'creature-feats';
  return toDetailRow(data as Record<string, unknown>, includeFeatLvl);
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
