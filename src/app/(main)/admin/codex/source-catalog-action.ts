'use server';

import { getCodexSourceCatalog, type CodexSourceCatalogEntry } from '@/lib/codex/source-catalog';

/** Names already stored on any of the nine codex tables, with per-table counts. */
export async function listCodexSourceCatalog(): Promise<CodexSourceCatalogEntry[]> {
  try {
    return await getCodexSourceCatalog();
  } catch {
    return [];
  }
}
