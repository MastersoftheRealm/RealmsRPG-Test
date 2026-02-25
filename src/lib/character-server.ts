/**
 * Character Server (Supabase)
 * ===========================
 * Server-side character fetching for SSR.
 */

import { createClient } from '@/lib/supabase/server';

type CharacterRow = { id: string; user_id: string; data: unknown; created_at: string | null; updated_at: string | null };

export async function getUserCharacters(userId: string) {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('characters')
    .select('id, user_id, data, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  const list = (rows ?? []) as CharacterRow[];
  return list.map((r) => {
    const d = (r.data as Record<string, unknown>) ?? {};
    return {
      id: r.id,
      name: (d.name as string) || 'Unnamed',
      level: (d.level as number) ?? 1,
      portrait: d.portrait,
      archetypeName: (d.archetype as { name?: string; type?: string })?.name
        || ((d.archetype as { type?: string })?.type?.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')),
      ancestryName: (d.ancestry as { name?: string })?.name || (d.species as string),
      status: d.status,
      updatedAt: r.updated_at,
    };
  });
}

export async function getCharacterById(userId: string, characterId: string) {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from('characters')
    .select('id, user_id, data, created_at, updated_at')
    .eq('id', characterId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!row) return null;
  const r = row as CharacterRow;
  const d = (r.data as Record<string, unknown>) ?? {};
  return {
    id: r.id,
    name: (d.name as string) || 'Unnamed',
    level: (d.level as number) ?? 1,
    ...d,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
