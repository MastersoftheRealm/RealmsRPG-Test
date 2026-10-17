'use server';

import { isAdmin } from '@/lib/admin';
import { logApiError } from '@/lib/api-error';
import {
  loadAdminCodexSourceRows,
  type AdminCodexSourceRowsByTable,
} from '@/lib/codex/admin-source-list';
import { getCodexSourceCatalog, type CodexSourceCatalogEntry } from '@/lib/codex/source-catalog';
import { getSession } from '@/lib/supabase/session';

const AUTH_ERROR = 'Authentication required';
const ADMIN_ERROR = 'Admin access required';
export const ADMIN_SOURCES_LOAD_ERROR = 'Could not load sources.';

async function requireAdmin(): Promise<string> {
  const { user } = await getSession();
  if (!user?.uid) throw new Error(AUTH_ERROR);
  if (!(await isAdmin(user.uid))) throw new Error(ADMIN_ERROR);
  return user.uid;
}

export async function fetchAdminCodexSourceCatalog(): Promise<CodexSourceCatalogEntry[]> {
  try {
    await requireAdmin();
    return await getCodexSourceCatalog();
  } catch (err) {
    logApiError('admin-sources-catalog', err);
    if (err instanceof Error && (err.message === AUTH_ERROR || err.message === ADMIN_ERROR)) {
      throw err;
    }
    throw new Error(ADMIN_SOURCES_LOAD_ERROR);
  }
}

export async function fetchAdminCodexSourceRows(): Promise<AdminCodexSourceRowsByTable> {
  try {
    await requireAdmin();
    return await loadAdminCodexSourceRows();
  } catch (err) {
    logApiError('admin-sources-rows', err);
    if (err instanceof Error && (err.message === AUTH_ERROR || err.message === ADMIN_ERROR)) {
      throw err;
    }
    throw new Error(ADMIN_SOURCES_LOAD_ERROR);
  }
}
