/**
 * Library Server Actions
 * =======================
 * Server actions for user's library items (powers, techniques, items, creatures).
 * Uses Supabase + session.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/supabase/session';
import { ensureUserProfile } from '@/lib/ensure-user-profile';
import { rowToItem, bodyToColumnar, toDbRow } from '@/lib/library-columnar';

const TABLE: Record<string, string> = {
  powers: 'user_powers',
  techniques: 'user_techniques',
  items: 'user_items',
  creatures: 'user_creatures',
};

async function getList(type: 'powers' | 'techniques' | 'items' | 'creatures') {
  const user = await requireAuth();
  const supabase = await createClient();
  const table = TABLE[type];
  const { data: rows } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', user.uid)
    .order('created_at', { ascending: false });
  return (rows ?? []) as Record<string, unknown>[];
}

async function saveColumnar(
  type: 'powers' | 'techniques' | 'items' | 'creatures',
  data: Record<string, unknown>
) {
  const user = await requireAuth();
  const supabase = await createClient();
  await ensureUserProfile(supabase, user.uid);
  const now = new Date();
  const { scalars, payload } = bodyToColumnar(type, { ...data, updatedAt: now });
  const row = toDbRow({
    id: crypto.randomUUID(),
    userId: user.uid,
    ...scalars,
    payload,
    createdAt: now,
    updatedAt: now,
  });
  const { data: created, error } = await supabase.from(TABLE[type]).insert(row).select('id').single();
  if (error) throw error;
  return created.id;
}

async function deleteColumnar(type: 'powers' | 'techniques' | 'items' | 'creatures', id: string) {
  const user = await requireAuth();
  const supabase = await createClient();
  const { data: existing } = await supabase.from(TABLE[type]).select('id').eq('id', id).eq('user_id', user.uid).maybeSingle();
  if (!existing) return false;
  const { error } = await supabase.from(TABLE[type]).delete().eq('id', id).eq('user_id', user.uid);
  if (error) throw error;
  return true;
}

function normDate(item: Record<string, unknown>, key: string) {
  const v = item[key];
  if (v && typeof v === 'object' && 'toISOString' in (v as object))
    (item as Record<string, unknown>)[key] = (v as Date).toISOString?.() ?? null;
}

// =============================================================================
// Powers
// =============================================================================

export async function getUserPowersAction() {
  try {
    const rows = await getList('powers');
    const powers = rows.map((r) => {
      const item = rowToItem('powers', r, 'user');
      normDate(item, 'createdAt');
      normDate(item, 'updatedAt');
      return item;
    });
    return { powers, error: null };
  } catch (error) {
    console.error('Error fetching powers:', error);
    return { powers: [], error: 'Failed to fetch powers' };
  }
}

export async function savePowerAction(data: {
  name: string;
  description?: string;
  parts: unknown[];
  damage?: unknown;
  actionType?: string;
  range?: unknown;
  area?: unknown;
  duration?: unknown;
  totalEN?: number;
  totalTP?: number;
}) {
  try {
    const id = await saveColumnar('powers', { ...data });
    revalidatePath('/library');
    return { id, error: null };
  } catch (error) {
    console.error('Error saving power:', error);
    return { id: null, error: 'Failed to save power' };
  }
}

export async function deletePowerAction(powerId: string) {
  try {
    const ok = await deleteColumnar('powers', powerId);
    revalidatePath('/library');
    return { success: ok, error: null };
  } catch (error) {
    console.error('Error deleting power:', error);
    return { success: false, error: 'Failed to delete power' };
  }
}

// =============================================================================
// Techniques
// =============================================================================

export async function getUserTechniquesAction() {
  try {
    const rows = await getList('techniques');
    const techniques = rows.map((r) => {
      const item = rowToItem('techniques', r, 'user');
      normDate(item, 'createdAt');
      normDate(item, 'updatedAt');
      return item;
    });
    return { techniques, error: null };
  } catch (error) {
    console.error('Error fetching techniques:', error);
    return { techniques: [], error: 'Failed to fetch techniques' };
  }
}

export async function saveTechniqueAction(data: {
  name: string;
  description?: string;
  parts: unknown[];
  damage?: unknown;
  actionType?: string;
  range?: unknown;
  staminaCost?: number;
  totalTP?: number;
}) {
  try {
    const id = await saveColumnar('techniques', { ...data });
    revalidatePath('/library');
    return { id, error: null };
  } catch (error) {
    console.error('Error saving technique:', error);
    return { id: null, error: 'Failed to save technique' };
  }
}

export async function deleteTechniqueAction(techniqueId: string) {
  try {
    const ok = await deleteColumnar('techniques', techniqueId);
    revalidatePath('/library');
    return { success: ok, error: null };
  } catch (error) {
    console.error('Error deleting technique:', error);
    return { success: false, error: 'Failed to delete technique' };
  }
}

// =============================================================================
// Items
// =============================================================================

export async function getUserItemsAction() {
  try {
    const rows = await getList('items');
    const items = rows.map((r) => {
      const item = rowToItem('items', r, 'user');
      normDate(item, 'createdAt');
      normDate(item, 'updatedAt');
      return item;
    });
    return { items, error: null };
  } catch (error) {
    console.error('Error fetching items:', error);
    return { items: [], error: 'Failed to fetch items' };
  }
}

export async function saveItemAction(data: {
  name: string;
  description?: string;
  type: string;
  properties: unknown[];
  goldCost?: number;
  damage?: unknown;
  armorValue?: number;
}) {
  try {
    const id = await saveColumnar('items', { ...data });
    revalidatePath('/library');
    return { id, error: null };
  } catch (error) {
    console.error('Error saving item:', error);
    return { id: null, error: 'Failed to save item' };
  }
}

export async function deleteItemAction(itemId: string) {
  try {
    const ok = await deleteColumnar('items', itemId);
    revalidatePath('/library');
    return { success: ok, error: null };
  } catch (error) {
    console.error('Error deleting item:', error);
    return { success: false, error: 'Failed to delete item' };
  }
}

// =============================================================================
// Creatures
// =============================================================================

export async function getUserCreaturesAction() {
  try {
    const rows = await getList('creatures');
    const creatures = rows.map((r) => {
      const item = rowToItem('creatures', r, 'user');
      normDate(item, 'createdAt');
      normDate(item, 'updatedAt');
      return item;
    });
    return { creatures, error: null };
  } catch (error) {
    console.error('Error fetching creatures:', error);
    return { creatures: [], error: 'Failed to fetch creatures' };
  }
}

export async function saveCreatureAction(data: Record<string, unknown>) {
  try {
    const id = await saveColumnar('creatures', { ...data });
    revalidatePath('/library');
    return { id, error: null };
  } catch (error) {
    console.error('Error saving creature:', error);
    return { id: null, error: 'Failed to save creature' };
  }
}

export async function deleteCreatureAction(creatureId: string) {
  try {
    const ok = await deleteColumnar('creatures', creatureId);
    revalidatePath('/library');
    return { success: ok, error: null };
  } catch (error) {
    console.error('Error deleting creature:', error);
    return { success: false, error: 'Failed to delete creature' };
  }
}
