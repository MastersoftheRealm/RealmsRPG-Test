'use client';

import type { QueryClient } from '@tanstack/react-query';
import { patchAdminCodexCollectionRow } from '@/hooks/use-codex';
import type { CodexCollection } from '@/lib/codex/collections';
import { updateCodexDoc } from './actions';

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
