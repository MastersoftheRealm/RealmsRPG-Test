/**
 * Character Server Actions
 * =========================
 * Server actions for character CRUD operations.
 * Uses Supabase + session.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/supabase/session';
import { ensureUserProfile } from '@/lib/ensure-user-profile';
import { removeUndefined } from '@/lib/utils';
import type { Character } from '@/types';

function prepareForSave(data: Partial<Character>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...dataToSave } = data;

  const cleaned = { ...dataToSave } as Record<string, unknown>;
  delete cleaned._displayFeats;
  delete cleaned.allTraits;
  delete cleaned.defenses;
  delete cleaned.defenseBonuses;

  cleaned.updatedAt = new Date().toISOString();
  return removeUndefined(cleaned);
}

export async function getCharactersAction() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: rows } = await supabase
      .from('characters')
      .select('id, user_id, data, updated_at')
      .eq('user_id', user.uid)
      .order('updated_at', { ascending: false });

    const list = (rows ?? []) as { id: string; data: unknown; updated_at: string | null }[];
    const characters = list.map((r) => {
      const d = (r.data as Record<string, unknown>) ?? {};
      return {
        id: r.id,
        name: (d.name as string) || 'Unnamed',
        level: (d.level as number) || 1,
        portrait: d.portrait as string | undefined,
        archetypeName: (d.archetype as { name?: string; type?: string })?.name
          || ((d.archetype as { type?: string })?.type?.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')),
        ancestryName: (d.ancestry as { name?: string })?.name || (d.species as string),
        status: d.status as string | undefined,
        updatedAt: r.updated_at ?? null,
      };
    });

    return { characters, error: null };
  } catch (error) {
    console.error('Error fetching characters:', error);
    return { characters: [], error: 'Failed to fetch characters' };
  }
}

export async function getCharacterAction(characterId: string) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: row } = await supabase
      .from('characters')
      .select('id, user_id, data, created_at, updated_at')
      .eq('id', characterId)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!row) {
      return { character: null, error: 'Character not found' };
    }

    const d = (row.data as Record<string, unknown>) ?? {};
    const character = {
      id: row.id,
      ...d,
      createdAt: (d.createdAt as string) ?? row.created_at ?? null,
      updatedAt: (d.updatedAt as string) ?? row.updated_at ?? null,
    };

    return { character, error: null };
  } catch (error) {
    console.error('Error fetching character:', error);
    return { character: null, error: 'Failed to fetch character' };
  }
}

export async function createCharacterAction(data: Partial<Character>) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const cleanedData = prepareForSave(data);
    (cleanedData as Record<string, unknown>).createdAt = new Date().toISOString();

    await ensureUserProfile(supabase, user.uid);

    const { data: created, error } = await supabase
      .from('characters')
      .insert({ user_id: user.uid, data: cleanedData })
      .select('id')
      .single();
    if (error) throw error;

    revalidatePath('/characters');
    return { id: created.id, error: null };
  } catch (error) {
    console.error('Error creating character:', error);
    return { id: null, error: 'Failed to create character' };
  }
}

export async function updateCharacterAction(characterId: string, data: Partial<Character>) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const cleanedData = prepareForSave(data);

    const { data: existing } = await supabase
      .from('characters')
      .select('id, data')
      .eq('id', characterId)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!existing) {
      return { success: false, error: 'Character not found' };
    }

    const currentData = (existing.data as Record<string, unknown>) ?? {};
    const merged = { ...currentData, ...cleanedData };

    const { error } = await supabase
      .from('characters')
      .update({ data: merged })
      .eq('id', characterId)
      .eq('user_id', user.uid);
    if (error) throw error;

    revalidatePath('/characters');
    revalidatePath(`/characters/${characterId}`);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating character:', error);
    return { success: false, error: 'Failed to update character' };
  }
}

export async function deleteCharacterAction(characterId: string) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from('characters')
      .select('id')
      .eq('id', characterId)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!existing) {
      return { success: false, error: 'Character not found' };
    }

    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId)
      .eq('user_id', user.uid);
    if (error) throw error;

    revalidatePath('/characters');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting character:', error);
    return { success: false, error: 'Failed to delete character' };
  }
}

export async function duplicateCharacterAction(characterId: string) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from('characters')
      .select('id, data')
      .eq('id', characterId)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!existing) {
      return { id: null, error: 'Character not found' };
    }

    const d = (existing.data as Record<string, unknown>) ?? {};
    const baseData = { ...d };
    delete baseData.createdAt;
    delete baseData.updatedAt;
    const newData = {
      ...baseData,
      name: `${(baseData.name as string) || 'Unnamed'} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data: created, error } = await supabase
      .from('characters')
      .insert({ user_id: user.uid, data: newData })
      .select('id')
      .single();
    if (error) throw error;

    revalidatePath('/characters');
    return { id: created.id, error: null };
  } catch (error) {
    console.error('Error duplicating character:', error);
    return { id: null, error: 'Failed to duplicate character' };
  }
}
