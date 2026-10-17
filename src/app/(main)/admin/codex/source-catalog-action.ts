'use server';

import { logApiError } from '@/lib/api-error';
import { getCodexSourceCatalog, type CodexSourceCatalogEntry } from '@/lib/codex/source-catalog';

/**
 * Names already stored on any of the nine codex tables, with per-table counts.
 * A failure throws a generic error so the client does not cache an empty catalog.
 */
export async function listCodexSourceCatalog(): Promise<CodexSourceCatalogEntry[]> {
  try {
    return await getCodexSourceCatalog();
  } catch (err) {
    logApiError('codex-source-catalog', err);
    throw new Error('Sources could not be loaded.');
  }
}
