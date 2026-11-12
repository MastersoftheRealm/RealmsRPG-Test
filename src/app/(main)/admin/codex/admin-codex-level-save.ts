'use client';

import type { QueryClient } from '@tanstack/react-query';
import { patchAdminCodexCollectionRow } from '@/hooks/use-codex';
import type { CodexCollection } from '@/lib/codex/collections';
import { createCodexDoc, updateCodexDoc } from './actions';
import { isAdminPendingFeatLevelId } from './admin-pending-feat-level-id';

/** Save each dirty level of one feat family. Shared by the character and creature feat editors. */
export async function persistCodexLevelEdits<TForm>(options: {
  collection: CodexCollection;
  editsById: Record<string, TForm>;
  updatedAtForId: (id: string) => string | undefined;
  toPayload: (form: TForm) => Record<string, unknown>;
  invalidMessage: (id: string, form: TForm | undefined) => string | null;
  queryClient: QueryClient;
}): Promise<string | null> {
  const errors: string[] = [];

  for (const id of Object.keys(options.editsById)) {
    const form = options.editsById[id];
    const invalid = options.invalidMessage(id, form);
    if (invalid) {
      errors.push(invalid);
      continue;
    }
    if (!form) continue;

    const result = await updateCodexDoc(options.collection, id, options.toPayload(form), {
      expectedUpdatedAt: options.updatedAtForId(id),
    });
    if (!result.success) {
      errors.push(`Update ${id}: ${result.error}`);
      continue;
    }
    if (result.updatedAt) {
      patchAdminCodexCollectionRow(options.queryClient, options.collection, id, {
        updated_at: result.updatedAt,
      });
    }
  }

  if (errors.length === 0) return null;
  return (
    errors.slice(0, 6).join('; ') + (errors.length > 6 ? `; ... and ${errors.length - 6} more` : '')
  );
}

/** Creates pending levels and updates dirty existing rows in one save. */
export async function persistCodexFamilyLevelEdits<TForm>(options: {
  collection: CodexCollection;
  editsById: Record<string, TForm>;
  updatedAtForId: (id: string) => string | undefined;
  toPayload: (form: TForm) => Record<string, unknown>;
  invalidMessage: (id: string, form: TForm | undefined) => string | null;
  queryClient: QueryClient;
}): Promise<string | null> {
  const errors: string[] = [];
  const updateIds: string[] = [];
  const createEntries: Array<{ id: string; form: TForm }> = [];

  for (const id of Object.keys(options.editsById)) {
    const form = options.editsById[id];
    if (!form) continue;
    if (isAdminPendingFeatLevelId(id)) {
      createEntries.push({ id, form });
    } else {
      updateIds.push(id);
    }
  }

  createEntries.sort((a, b) => {
    const aLvl = Number((options.toPayload(a.form).feat_lvl as number | undefined) ?? 0);
    const bLvl = Number((options.toPayload(b.form).feat_lvl as number | undefined) ?? 0);
    return aLvl - bLvl;
  });

  for (const { id, form } of createEntries) {
    const invalid = options.invalidMessage(id, form);
    if (invalid) {
      errors.push(invalid);
      continue;
    }
    const result = await createCodexDoc(options.collection, undefined, options.toPayload(form));
    if (!result.success) {
      errors.push(`Create level: ${result.error ?? 'failed'}`);
      continue;
    }
    if ('id' in result && result.id) {
      patchAdminCodexCollectionRow(options.queryClient, options.collection, result.id, {});
    }
  }

  for (const id of updateIds) {
    const form = options.editsById[id];
    const invalid = options.invalidMessage(id, form);
    if (invalid) {
      errors.push(invalid);
      continue;
    }
    if (!form) continue;

    const result = await updateCodexDoc(options.collection, id, options.toPayload(form), {
      expectedUpdatedAt: options.updatedAtForId(id),
    });
    if (!result.success) {
      errors.push(`Update ${id}: ${result.error}`);
      continue;
    }
    if (result.updatedAt) {
      patchAdminCodexCollectionRow(options.queryClient, options.collection, id, {
        updated_at: result.updatedAt,
      });
    }
  }

  if (errors.length === 0) return null;
  return (
    errors.slice(0, 6).join('; ') + (errors.length > 6 ? `; ... and ${errors.length - 6} more` : '')
  );
}
