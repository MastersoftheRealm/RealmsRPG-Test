'use server';

import { updateCodexDoc } from '@/app/(main)/admin/codex/actions';
import { isAdmin } from '@/lib/admin';
import { logApiError } from '@/lib/api-error';
import {
  loadAdminCodexSourceRows,
  type AdminCodexSourceRowsPayload,
} from '@/lib/codex/admin-source-rows';
import { assertCodexCollection } from '@/lib/codex/collections';
import { getCodexSourceCatalog, type CodexSourceCatalogEntry } from '@/lib/codex/source-catalog';
import type { CodexSourceTable } from '@/lib/codex/source-catalog';
import {
  codexSourcesAfterAdd,
  codexSourcesAfterRemove,
  codexSourceNameError,
  collapseCodexSourceName,
} from '@/lib/codex/sources';
import { getSession } from '@/lib/supabase/session';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  ADMIN_SOURCES_ADD_FAILED,
  ADMIN_SOURCES_LOAD_ERROR,
  ADMIN_SOURCES_NAME_REQUIRED,
  ADMIN_SOURCES_NOT_FOUND,
  ADMIN_SOURCES_REMOVE_FAILED,
  ADMIN_SOURCES_UNKNOWN_COLLECTION,
} from './admin-sources-copy';

const AUTH_ERROR = 'Authentication required';
const ADMIN_ERROR = 'Admin access required';

export type AdminCodexSourceMembershipTarget = {
  table: CodexSourceTable;
  id: string | number;
  expectedUpdatedAt?: string | null | undefined;
};

export type AdminCodexSourceMembershipResult = {
  success: boolean;
  updatedCount: number;
  error?: string | undefined;
  conflict?: boolean | undefined;
};

async function requireAdmin(): Promise<string> {
  const { user } = await getSession();
  if (!user?.uid) throw new Error(AUTH_ERROR);
  if (!(await isAdmin(user.uid))) throw new Error(ADMIN_ERROR);
  return user.uid;
}

function validateSourceName(sourceName: string): string | null {
  const collapsed = collapseCodexSourceName(sourceName);
  if (!collapsed) return ADMIN_SOURCES_NAME_REQUIRED;
  return codexSourceNameError(collapsed);
}

function sourceTableOrError(table: string): CodexSourceTable | { error: string } {
  try {
    const collection = assertCodexCollection(table);
    if (collection === 'core_rules') return { error: ADMIN_SOURCES_UNKNOWN_COLLECTION };
    return collection;
  } catch {
    return { error: ADMIN_SOURCES_UNKNOWN_COLLECTION };
  }
}

/** Stored `sources` only. The next array is computed from this row, not from the client. */
async function readStoredSources(
  table: CodexSourceTable,
  id: string,
  failedMessage: string,
): Promise<{ ok: true; sources: unknown } | { ok: false; error: string }> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from(table).select('sources').eq('id', id).maybeSingle();
  if (error) {
    logApiError('admin-sources-read', error);
    return { ok: false, error: failedMessage };
  }
  if (!data) return { ok: false, error: ADMIN_SOURCES_NOT_FOUND };
  return { ok: true, sources: (data as { sources?: unknown }).sources };
}

async function applyMembershipWrite(
  op: 'add' | 'remove',
  target: AdminCodexSourceMembershipTarget,
  sourceName: string,
): Promise<{ success: boolean; error?: string | undefined; conflict?: boolean | undefined }> {
  const failedMessage = op === 'add' ? ADMIN_SOURCES_ADD_FAILED : ADMIN_SOURCES_REMOVE_FAILED;
  const nameError = validateSourceName(sourceName);
  if (nameError) return { success: false, error: nameError };

  const table = sourceTableOrError(target.table);
  if (typeof table !== 'string') return { success: false, error: table.error };

  const id = String(target.id);
  const stored = await readStoredSources(table, id, failedMessage);
  if (!stored.ok) return { success: false, error: stored.error };

  const collapsed = collapseCodexSourceName(sourceName);
  const nextSources =
    op === 'add'
      ? codexSourcesAfterAdd(stored.sources, collapsed)
      : codexSourcesAfterRemove(stored.sources, collapsed);

  const options =
    target.expectedUpdatedAt != null && target.expectedUpdatedAt !== ''
      ? { expectedUpdatedAt: target.expectedUpdatedAt }
      : undefined;

  return updateCodexDoc(table, id, { sources: nextSources }, options);
}

export async function addAdminCodexSourceMembership(
  target: AdminCodexSourceMembershipTarget,
  sourceName: string,
): Promise<AdminCodexSourceMembershipResult> {
  try {
    await requireAdmin();
    const result = await applyMembershipWrite('add', target, sourceName);
    if (!result.success) {
      return {
        success: false,
        updatedCount: 0,
        error: result.error,
        conflict: result.conflict,
      };
    }
    return { success: true, updatedCount: 1 };
  } catch (err) {
    logApiError('admin-sources-add', err);
    if (err instanceof Error && (err.message === AUTH_ERROR || err.message === ADMIN_ERROR)) {
      return { success: false, updatedCount: 0, error: err.message };
    }
    return { success: false, updatedCount: 0, error: ADMIN_SOURCES_ADD_FAILED };
  }
}

export async function removeAdminCodexSourceMembership(
  target: AdminCodexSourceMembershipTarget,
  sourceName: string,
): Promise<AdminCodexSourceMembershipResult> {
  try {
    await requireAdmin();
    const result = await applyMembershipWrite('remove', target, sourceName);
    if (!result.success) {
      return {
        success: false,
        updatedCount: 0,
        error: result.error,
        conflict: result.conflict,
      };
    }
    return { success: true, updatedCount: 1 };
  } catch (err) {
    logApiError('admin-sources-remove', err);
    if (err instanceof Error && (err.message === AUTH_ERROR || err.message === ADMIN_ERROR)) {
      return { success: false, updatedCount: 0, error: err.message };
    }
    return { success: false, updatedCount: 0, error: ADMIN_SOURCES_REMOVE_FAILED };
  }
}

export async function batchAddAdminCodexSourceMembership(
  targets: AdminCodexSourceMembershipTarget[],
  sourceName: string,
): Promise<AdminCodexSourceMembershipResult> {
  let updatedCount = 0;
  for (const target of targets) {
    const result = await addAdminCodexSourceMembership(target, sourceName);
    if (!result.success) {
      return {
        success: false,
        updatedCount,
        error: result.error,
        conflict: result.conflict,
      };
    }
    updatedCount += result.updatedCount;
  }
  return { success: true, updatedCount };
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

export async function fetchAdminCodexSourceRows(): Promise<AdminCodexSourceRowsPayload> {
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
