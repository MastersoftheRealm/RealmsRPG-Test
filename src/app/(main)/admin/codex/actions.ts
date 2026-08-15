'use server';

import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { recordCodexChange, type RecordCodexChangeInput } from '@/lib/codex-changelog';
import { featTagsToNormalizeInput, parseFeatTagsFromDb } from '@/lib/codex/feat-tags';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  assertCodexCollection,
  isColumnarCollection,
  type CodexCollection,
} from '@/lib/codex/collections';
import { toColumnarPayload, toDbPayload } from './codex-column-map';
import { allocateCodexNumericId, fetchRetiredIds, retireCodexId } from '@/lib/codex/id-allocation';
import { findReferencesInRows, REFERENCE_PROBES } from '@/lib/codex/references';
import {
  buildArchetypeLevelRows,
  buildArchetypeRow,
  restorableLevelRows,
  type SaveArchetypeWithPathInput,
} from './codex-archetype-write';

const MAX_REPORTED_REFERENCES = 20;

const CONFLICT_MESSAGE =
  'This entity changed since you opened it. Reload the page and reapply your edit.';

async function requireAdmin() {
  const { user } = await getSession();
  if (!user?.uid) throw new Error('Authentication required');
  if (!(await isAdmin(user.uid))) throw new Error('Admin access required');
  return user.uid;
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 150);
}

function getTableName(collection: CodexCollection): string {
  return collection;
}

function getSupabaseAdmin() {
  return createServiceRoleClient();
}

/**
 * The changelog is an audit trail, not part of the mutation. A failed insert used to invert a
 * completed write into `{ success: false }`, which made admins retry and duplicate the entity.
 * Same contract as the role-change audit in api/admin/users/update-role.
 */
async function recordCodexChangeBestEffort(input: RecordCodexChangeInput): Promise<void> {
  try {
    await recordCodexChange(input);
  } catch (err) {
    console.error('[Admin Codex] changelog write failed (mutation kept):', err);
  }
}

/** Run DB `normalize_feat_tags` on admin feat saves so merges stay canonical. */
async function applyFeatTagNormalization(
  collection: CodexCollection,
  data: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (collection !== 'codex_feats' || !('tags' in data)) return data;
  const input = featTagsToNormalizeInput(parseFeatTagsFromDb(data.tags));
  if (!input) return { ...data, tags: null };
  const supabase = getSupabaseAdmin();
  const { data: normalized, error } = await supabase.rpc('normalize_feat_tags', {
    tag_string: input,
  });
  if (error || normalized == null || normalized === '') {
    return data;
  }
  return { ...data, tags: normalized };
}

async function fetchRowById(table: string, id: string): Promise<Record<string, unknown> | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown> | null) ?? null;
}

type ArchetypeSnapshot = {
  archetype: Record<string, unknown>;
  levels: Record<string, unknown>[];
};

async function getArchetypeSnapshot(archetypeId: string): Promise<ArchetypeSnapshot | null> {
  const supabase = getSupabaseAdmin();
  const { data: archetype, error: archetypeError } = await supabase
    .from('codex_archetypes')
    .select('*')
    .eq('id', archetypeId)
    .maybeSingle();
  if (archetypeError) throw new Error(archetypeError.message);
  if (!archetype) return null;

  const { data: levels, error: levelsError } = await supabase
    .from('codex_archetype_levels')
    .select('*')
    .eq('archetype_id', archetypeId)
    .order('level', { ascending: true });
  if (levelsError) throw new Error(levelsError.message);

  return {
    archetype: archetype as Record<string, unknown>,
    levels: (levels ?? []) as Record<string, unknown>[],
  };
}

/** Inbound references to a codex row, as display strings. Empty when nothing points at it. */
async function findCodexReferences(collection: CodexCollection, id: string): Promise<string[]> {
  const probes = REFERENCE_PROBES[collection];
  if (!probes || !id) return [];
  const supabase = getSupabaseAdmin();
  const found: string[] = [];

  for (const probe of probes) {
    const { data, error } = await supabase.from(probe.table).select(probe.selectColumns);
    if (error) {
      console.error('[Admin Codex] reference scan failed for', probe.table, error.message);
      continue;
    }
    const rows = ((data ?? []) as unknown as Record<string, unknown>[]).filter(
      (row) => !(probe.table === collection && String(row.id ?? '') === id),
    );
    found.push(...findReferencesInRows(probe, rows, id));
  }

  return found;
}

export async function createCodexDoc(
  collection: CodexCollection,
  id: string | undefined,
  data: Record<string, unknown>,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const changedByUserId = await requireAdmin();
    const safeCollection = assertCodexCollection(collection);
    const supabase = getSupabaseAdmin();
    const table = getTableName(safeCollection);

    const shouldAllocateNumeric = isColumnarCollection(safeCollection);
    // Prefer numeric IDs for codex reference data so renaming doesn't imply ID changes.
    let docId = sanitizeId(id ?? '');
    if (!docId && shouldAllocateNumeric) {
      docId = await allocateCodexNumericId(supabase, table);
    }
    docId = docId || `doc_${Date.now()}`;

    // Retired ids belong to deleted entities that saved characters may still reference.
    const retiredIds = shouldAllocateNumeric
      ? await fetchRetiredIds(supabase, table)
      : new Set<string>();

    // Small retry loop for rare concurrency collisions.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: existing } = await supabase
        .from(table)
        .select('id')
        .eq('id', docId)
        .maybeSingle();
      if (!existing && !retiredIds.has(docId)) break;
      if (!shouldAllocateNumeric)
        return { success: false, error: `Document ${docId} already exists` };
      docId = await allocateCodexNumericId(supabase, table);
    }

    if (shouldAllocateNumeric) {
      const normalizedData = await applyFeatTagNormalization(safeCollection, data);
      const payload = toColumnarPayload(safeCollection, normalizedData);
      const dbPayload = toDbPayload(safeCollection, { id: docId, ...payload });
      const { data: inserted, error } = await supabase
        .from(table)
        .insert(dbPayload)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await recordCodexChangeBestEffort({
        entityType: safeCollection,
        entityId: docId,
        operation: 'create',
        changedByUserId,
        beforeData: null,
        afterData: (inserted as Record<string, unknown> | null) ?? null,
      });
    } else {
      const { data: inserted, error } = await supabase
        .from(table)
        .insert({ id: docId, data })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      await recordCodexChangeBestEffort({
        entityType: safeCollection,
        entityId: docId,
        operation: 'create',
        changedByUserId,
        beforeData: null,
        afterData: (inserted as Record<string, unknown> | null) ?? null,
      });
    }

    revalidatePath('/admin/codex');
    revalidatePath('/codex');
    return { success: true, id: docId };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to create' };
  }
}

export async function updateCodexDoc(
  collection: CodexCollection,
  id: string,
  data: Record<string, unknown>,
  options?: { expectedUpdatedAt?: string },
): Promise<{ success: boolean; error?: string; conflict?: boolean }> {
  try {
    const changedByUserId = await requireAdmin();
    const safeCollection = assertCodexCollection(collection);
    const supabase = getSupabaseAdmin();
    const table = getTableName(safeCollection);

    const before = await fetchRowById(table, id);
    if (!before) {
      return { success: false, error: 'Document not found' };
    }

    // Optimistic lock: only enforced when the caller sends the version it loaded, so callers
    // that never read `updated_at` (and tables that do not have the column yet) are unaffected.
    const currentUpdatedAt = typeof before.updated_at === 'string' ? before.updated_at : null;
    const expectedUpdatedAt = options?.expectedUpdatedAt;
    const lockOn = expectedUpdatedAt && currentUpdatedAt ? currentUpdatedAt : null;
    if (expectedUpdatedAt && currentUpdatedAt && expectedUpdatedAt !== currentUpdatedAt) {
      return { success: false, conflict: true, error: CONFLICT_MESSAGE };
    }

    if (isColumnarCollection(safeCollection)) {
      const normalizedData = await applyFeatTagNormalization(safeCollection, data);
      const payload = toColumnarPayload(safeCollection, normalizedData);
      const dbPayload = toDbPayload(safeCollection, payload);
      if (currentUpdatedAt) dbPayload.updated_at = new Date().toISOString();
      let query = supabase.from(table).update(dbPayload).eq('id', id);
      if (lockOn) query = query.eq('updated_at', lockOn);
      const { data: after, error } = await query.select('*').maybeSingle();
      if (error) throw new Error(error.message);
      if (!after) return { success: false, conflict: true, error: CONFLICT_MESSAGE };
      await recordCodexChangeBestEffort({
        entityType: safeCollection,
        entityId: id,
        operation: 'update',
        changedByUserId,
        beforeData: before,
        afterData: after as Record<string, unknown>,
      });
    } else {
      let query = supabase
        .from(table)
        .update({ data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (lockOn) query = query.eq('updated_at', lockOn);
      const { data: after, error } = await query.select('*').maybeSingle();
      if (error) throw new Error(error.message);
      if (!after) return { success: false, conflict: true, error: CONFLICT_MESSAGE };
      await recordCodexChangeBestEffort({
        entityType: safeCollection,
        entityId: id,
        operation: 'update',
        changedByUserId,
        beforeData: before,
        afterData: after as Record<string, unknown>,
      });
    }

    revalidatePath('/admin/codex');
    revalidatePath('/codex');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to update' };
  }
}

export async function deleteCodexDoc(
  collection: CodexCollection,
  id: string,
  options?: { acknowledgeReferences?: boolean },
): Promise<{ success: boolean; error?: string; references?: string[] }> {
  try {
    const changedByUserId = await requireAdmin();
    const safeCollection = assertCodexCollection(collection);
    const supabase = getSupabaseAdmin();
    const table = getTableName(safeCollection);
    const before = await fetchRowById(table, id);

    if (!options?.acknowledgeReferences) {
      const references = await findCodexReferences(safeCollection, id);
      if (references.length > 0) {
        return {
          success: false,
          references: references.slice(0, MAX_REPORTED_REFERENCES),
          error: `${references.length} entities still reference this entry.`,
        };
      }
    }

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw new Error(error.message);

    // Tombstone before anything else can fail: a reused id silently repoints saved characters.
    if (isColumnarCollection(safeCollection)) {
      await retireCodexId(supabase, table, id);
    }

    if (before) {
      await recordCodexChangeBestEffort({
        entityType: safeCollection,
        entityId: id,
        operation: 'delete',
        changedByUserId,
        beforeData: before,
        afterData: null,
      });
    }

    revalidatePath('/admin/codex');
    revalidatePath('/codex');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to delete' };
  }
}

export async function saveArchetypeWithPath(
  payload: SaveArchetypeWithPathInput,
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const changedByUserId = await requireAdmin();
    const supabase = getSupabaseAdmin();
    const id = payload.id
      ? sanitizeId(payload.id)
      : await allocateCodexNumericId(supabase, 'codex_archetypes');
    const beforeSnapshot = await getArchetypeSnapshot(id);
    const existingLevels = beforeSnapshot?.levels ?? [];

    const cleanLevels = buildArchetypeLevelRows(id, payload.levels);

    const levelNumbers = cleanLevels.map((row) => Number(row.level));
    if (new Set(levelNumbers).size !== levelNumbers.length) {
      return {
        success: false,
        error: 'Duplicate levels in the progression; each level may appear once.',
      };
    }

    if (cleanLevels.length === 0 && existingLevels.length > 0) {
      return {
        success: false,
        error:
          `Refusing to save: this would delete all ${existingLevels.length} progression level(s) for this archetype. ` +
          'Add the levels back, or delete the archetype itself if that is the intent.',
      };
    }

    const { error: upsertError } = await supabase
      .from('codex_archetypes')
      .upsert(buildArchetypeRow(id, payload));
    if (upsertError) throw new Error(upsertError.message);

    await replaceArchetypeLevels(id, cleanLevels, existingLevels);

    const afterSnapshot = await getArchetypeSnapshot(id);
    if (!afterSnapshot) throw new Error('Failed to load saved archetype snapshot');

    await recordCodexChangeBestEffort({
      entityType: 'codex_archetypes',
      entityId: id,
      operation: beforeSnapshot ? 'update' : 'create',
      changedByUserId,
      beforeData: beforeSnapshot as Record<string, unknown> | null,
      afterData: afterSnapshot as Record<string, unknown> | null,
    });

    revalidatePath('/admin/codex');
    revalidatePath('/codex');
    return { success: true, id };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to save archetype path data',
    };
  }
}

/**
 * `codex_archetype_levels` has UNIQUE (archetype_id, level), so the new rows cannot be inserted
 * before the old ones are removed. Until the replace runs inside a Postgres function, the old
 * rows are restored from the snapshot when the insert or the row-count check fails.
 */
async function replaceArchetypeLevels(
  archetypeId: string,
  incoming: Record<string, unknown>[],
  snapshot: Record<string, unknown>[],
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error: clearError } = await supabase
    .from('codex_archetype_levels')
    .delete()
    .eq('archetype_id', archetypeId);
  if (clearError) throw new Error(clearError.message);

  if (incoming.length === 0) return;

  const { data: inserted, error: insertError } = await supabase
    .from('codex_archetype_levels')
    .insert(incoming)
    .select('id');

  const insertedCount = (inserted ?? []).length;
  if (insertError || insertedCount !== incoming.length) {
    const reason = insertError
      ? insertError.message
      : `wrote ${insertedCount} of ${incoming.length} levels`;
    const restored = await restoreArchetypeLevels(archetypeId, snapshot);
    throw new Error(
      restored
        ? `Progression levels were not saved (${reason}). The previous levels were restored.`
        : `Progression levels were not saved (${reason}) and could not be restored. ` +
            'The previous levels are in codex_change_logs.before_data for this archetype.',
    );
  }
}

async function restoreArchetypeLevels(
  archetypeId: string,
  snapshot: Record<string, unknown>[],
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  try {
    await supabase.from('codex_archetype_levels').delete().eq('archetype_id', archetypeId);
    if (snapshot.length === 0) return true;
    const { error } = await supabase
      .from('codex_archetype_levels')
      .insert(restorableLevelRows(snapshot));
    if (error) {
      console.error('[Admin Codex] archetype level restore failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Admin Codex] archetype level restore failed:', err);
    return false;
  }
}
