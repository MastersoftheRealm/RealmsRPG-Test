import { buildCodexChangelogPersistPayload } from '@/lib/codex-changelog-display';
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

export async function recordCodexChange(input: RecordCodexChangeInput): Promise<void> {
  const supabase = createServiceRoleClient();
  const persist = buildCodexChangelogPersistPayload(
    input.operation,
    input.beforeData,
    input.afterData,
  );
  const { error } = await supabase.from('codex_change_logs').insert({
    entity_type: input.entityType,
    entity_id: input.entityId,
    operation: input.operation,
    changed_by_user_id: input.changedByUserId,
    before_data: persist.before_data,
    after_data: persist.after_data,
    changed_fields: persist.changed_fields,
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
