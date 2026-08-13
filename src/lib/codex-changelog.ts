import { createServiceRoleClient } from '@/lib/supabase/server';

export type CodexChangeOperation = 'create' | 'update' | 'delete';

type JsonLike = Record<string, unknown> | null;

export type RecordCodexChangeInput = {
  entityType: string;
  entityId: string;
  operation: CodexChangeOperation;
  changedByUserId: string;
  beforeData: JsonLike;
  afterData: JsonLike;
};

function areEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Builds a compact top-level diff for quick list display.
 * Full snapshots are still persisted in before_data/after_data.
 */
export function computeChangedFields(beforeData: JsonLike, afterData: JsonLike): Record<string, unknown>[] {
  const before = beforeData ?? {};
  const after = afterData ?? {};
  const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)]);
  const changed: Record<string, unknown>[] = [];

  for (const key of keys) {
    const beforeValue = (before as Record<string, unknown>)[key] ?? null;
    const afterValue = (after as Record<string, unknown>)[key] ?? null;
    if (areEqual(beforeValue, afterValue)) continue;
    changed.push({
      field: key,
      before: beforeValue,
      after: afterValue,
    });
  }

  return changed;
}

export async function recordCodexChange(input: RecordCodexChangeInput): Promise<void> {
  const supabase = createServiceRoleClient();
  const changedFields = computeChangedFields(input.beforeData, input.afterData);
  const { error } = await supabase.from('codex_change_logs').insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    operation: input.operation,
    changed_by_user_id: input.changedByUserId,
    before_data: input.beforeData,
    after_data: input.afterData,
    changed_fields: changedFields,
  });

  // Never throw: the audit trail must not be able to fail a mutation that already
  // succeeded. Throwing here made createCodexDoc report failure after the entity was
  // written, so a retry allocated a new id and produced a duplicate official entity.
  // Callers treat changelog loss as a logged warning, matching the admin role-update path.
  if (error) {
    console.error('[codex-changelog] Failed to write changelog entry:', {
      entityType: input.entityType,
      entityId: input.entityId,
      operation: input.operation,
      message: error.message,
    });
  }
}
