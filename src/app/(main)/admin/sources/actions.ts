'use server';

import { updateCodexDoc } from '@/app/(main)/admin/codex/actions';
import { isAdmin } from '@/lib/admin';
import { logApiError } from '@/lib/api-error';
import {
  loadAdminCodexSourceRows,
  type AdminCodexSourceRowsPayload,
} from '@/lib/codex/admin-source-rows';
import { getCodexSourceCatalog, type CodexSourceCatalogEntry } from '@/lib/codex/source-catalog';
import type { CodexSourceTable } from '@/lib/codex/source-catalog';
import {
  codexSourcesAfterAdd,
  codexSourcesAfterRemove,
  codexSourceNameError,
  collapseCodexSourceName,
} from '@/lib/codex/sources';
import { getSession } from '@/lib/supabase/session';
import { ADMIN_SOURCES_LOAD_ERROR } from './admin-sources-copy';

const AUTH_ERROR = 'Authentication required';
const ADMIN_ERROR = 'Admin access required';

export type AdminCodexSourceMembershipTarget = {
  table: CodexSourceTable;
  id: string | number;
  expectedUpdatedAt?: string | null | undefined;
  currentSources: unknown;
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
  if (!collapsed) return 'Source name is required.';
  return codexSourceNameError(collapsed);
}

async function applyMembershipWrite(
  op: 'add' | 'remove',
  target: AdminCodexSourceMembershipTarget,
  sourceName: string,
): Promise<{ success: boolean; error?: string | undefined; conflict?: boolean | undefined }> {
  const nameError = validateSourceName(sourceName);
  if (nameError) return { success: false, error: nameError };

  const collapsed = collapseCodexSourceName(sourceName);
  const nextSources =
    op === 'add'
      ? codexSourcesAfterAdd(target.currentSources, collapsed)
      : codexSourcesAfterRemove(target.currentSources, collapsed);

  const id = String(target.id);
  const options =
    target.expectedUpdatedAt != null && target.expectedUpdatedAt !== ''
      ? { expectedUpdatedAt: target.expectedUpdatedAt }
      : undefined;

  return updateCodexDoc(target.table, id, { sources: nextSources }, options);
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
    return { success: false, updatedCount: 0, error: 'Failed to add item to source.' };
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
    return { success: false, updatedCount: 0, error: 'Failed to remove item from source.' };
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
