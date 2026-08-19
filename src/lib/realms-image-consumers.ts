/**
 * Realms Image Library — consumer table helpers (server-only).
 * Usage report + clear-on-delete + cache URL sync on replace (ADR-0003).
 * Official/codex columns: TASK-494. User_* columns: TASK-497.
 * Missing columns are skipped (probe + cache) for forward/backward safety.
 */

import type { createServiceRoleClient } from '@/lib/supabase/server';
import type { RealmsImageUsageRef } from '@/lib/realms-images';

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

/** Art-capable entity tables that will (or do) reference realms_images via image_id. */
export const REALMS_IMAGE_CONSUMER_TABLES = [
  { table: 'codex_species', entityKind: 'species', hasImageUrl: true },
  { table: 'codex_equipment', entityKind: 'equipment', hasImageUrl: true },
  { table: 'official_creatures', entityKind: 'creature', hasImageUrl: true },
  { table: 'official_items', entityKind: 'item', hasImageUrl: true },
  { table: 'official_powers', entityKind: 'power', hasImageUrl: true },
  { table: 'official_techniques', entityKind: 'technique', hasImageUrl: true },
  { table: 'official_empowered_techniques', entityKind: 'empowered_technique', hasImageUrl: true },
  { table: 'user_species', entityKind: 'user_species', hasImageUrl: true },
  { table: 'user_creatures', entityKind: 'user_creature', hasImageUrl: true },
  { table: 'user_items', entityKind: 'user_item', hasImageUrl: true },
  { table: 'user_powers', entityKind: 'user_power', hasImageUrl: true },
  { table: 'user_techniques', entityKind: 'user_technique', hasImageUrl: true },
  { table: 'user_empowered_techniques', entityKind: 'user_empowered_technique', hasImageUrl: true },
] as const;

const columnPresenceCache = new Map<string, boolean>();

async function tableHasImageIdColumn(supabase: ServiceClient, table: string): Promise<boolean> {
  const cached = columnPresenceCache.get(table);
  if (cached !== undefined) return cached;

  const { error } = await supabase.from(table).select('image_id').limit(0);

  let result: boolean;
  if (!error) {
    result = true;
  } else if (
    /does not exist|Could not find|PGRST204|column .*image_id/i.test(error.message ?? '')
  ) {
    result = false;
  } else {
    // Unexpected error — treat as absent so delete/usage do not fail hard pre-TASK-494.
    console.warn(`[realms-images] column probe failed for ${table}:`, error.message);
    result = false;
  }
  columnPresenceCache.set(table, result);
  return result;
}

export async function listRealmsImageUsages(
  supabase: ServiceClient,
  imageId: string,
): Promise<RealmsImageUsageRef[]> {
  const usages: RealmsImageUsageRef[] = [];

  for (const consumer of REALMS_IMAGE_CONSUMER_TABLES) {
    if (!(await tableHasImageIdColumn(supabase, consumer.table))) continue;

    const { data, error } = await supabase
      .from(consumer.table)
      .select('id, name')
      .eq('image_id', imageId);

    if (error) {
      console.warn(`[realms-images] usage query failed (${consumer.table}):`, error.message);
      continue;
    }

    for (const row of data ?? []) {
      const r = row as { id: string; name?: string | null | undefined };
      usages.push({
        table: consumer.table,
        id: String(r.id),
        name: r.name ?? null,
        entityKind: consumer.entityKind,
      });
    }
  }

  return usages;
}

async function updateConsumerRows(
  supabase: ServiceClient,
  table: string,
  imageId: string,
  patch: Record<string, string | null>,
): Promise<{ count: number; error: string | null }> {
  const attempt = async (body: Record<string, string | null>) =>
    supabase.from(table).update(body).eq('image_id', imageId).select('id');

  let { data, error } = await attempt(patch);
  if (error && /updated_at/i.test(error.message ?? '') && 'updated_at' in patch) {
    const { updated_at, ...withoutUpdated } = patch;
    void updated_at;
    ({ data, error } = await attempt(withoutUpdated));
  }
  if (error && /image_url/i.test(error.message ?? '') && 'image_url' in patch) {
    const { image_url, ...withoutUrl } = patch;
    void image_url;
    ({ data, error } = await attempt(withoutUrl));
    if (error && /updated_at/i.test(error.message ?? '') && 'updated_at' in withoutUrl) {
      const { updated_at, ...minimal } = withoutUrl;
      void updated_at;
      ({ data, error } = await attempt(minimal));
    }
  }
  if (error) return { count: 0, error: error.message };
  return { count: data?.length ?? 0, error: null };
}

/** Clear image_id (+ image_url cache when present) on all consumers. */
export async function clearRealmsImageRefs(
  supabase: ServiceClient,
  imageId: string,
): Promise<{ cleared: number; errors: string[] }> {
  let cleared = 0;
  const errors: string[] = [];

  for (const consumer of REALMS_IMAGE_CONSUMER_TABLES) {
    if (!(await tableHasImageIdColumn(supabase, consumer.table))) continue;

    const patch: Record<string, string | null> = {
      image_id: null,
      updated_at: new Date().toISOString(),
    };
    if (consumer.hasImageUrl) patch.image_url = null;

    const result = await updateConsumerRows(supabase, consumer.table, imageId, patch);
    if (result.error) {
      errors.push(`${consumer.table}: ${result.error}`);
      continue;
    }
    cleared += result.count;
  }

  return { cleared, errors };
}

/** Sync denormalized image_url cache on consumers after master file replace. */
export async function syncRealmsImageCacheUrls(
  supabase: ServiceClient,
  imageId: string,
  publicUrl: string,
): Promise<{ updated: number; errors: string[] }> {
  let updated = 0;
  const errors: string[] = [];

  for (const consumer of REALMS_IMAGE_CONSUMER_TABLES) {
    if (!consumer.hasImageUrl) continue;
    if (!(await tableHasImageIdColumn(supabase, consumer.table))) continue;

    const withTs = { image_url: publicUrl, updated_at: new Date().toISOString() };
    let { data, error } = await supabase
      .from(consumer.table)
      .update(withTs)
      .eq('image_id', imageId)
      .select('id');

    if (error && /updated_at/i.test(error.message ?? '')) {
      ({ data, error } = await supabase
        .from(consumer.table)
        .update({ image_url: publicUrl })
        .eq('image_id', imageId)
        .select('id'));
    }

    if (error) {
      // No image_url column yet — skip quietly (TASK-494 may add cache later)
      if (/image_url/i.test(error.message ?? '')) continue;
      errors.push(`${consumer.table}: ${error.message}`);
      continue;
    }
    updated += data?.length ?? 0;
  }

  return { updated, errors };
}
