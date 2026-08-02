/**
 * Owner Library for View
 * =======================
 * Server-only: fetches a user's library (powers, techniques, items, creatures) for
 * read-only display when viewing another user's character (public or campaign).
 * Uses Supabase (public.user_powers, user_techniques, user_items, user_creatures).
 *
 * Callers MUST verify authorization before invoking (e.g. public visibility, shared
 * campaign membership, or campaign RM roster check). This helper uses the service-role
 * client to bypass RLS on the owner's library tables — the viewer's session client
 * cannot read another user's rows.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { rowToItem } from '@/lib/library-columnar';

export interface LibraryForView {
  powers: Array<Record<string, unknown>>;
  techniques: Array<Record<string, unknown>>;
  items: Array<Record<string, unknown>>;
  creatures: Array<Record<string, unknown>>;
}

/**
 * Fetch a user's library items for display when viewing their character.
 * Used by GET /api/characters/[id] and GET /api/campaigns/[id]/characters/[userId]/[characterId].
 */
export async function getOwnerLibraryForView(ownerUserId: string): Promise<LibraryForView> {
  const supabase = createServiceRoleClient();
  const [powerRes, techniqueRes, itemRes, creatureRes] = await Promise.all([
    supabase.from('user_powers').select('*').eq('user_id', ownerUserId),
    supabase.from('user_techniques').select('*').eq('user_id', ownerUserId),
    supabase.from('user_items').select('*').eq('user_id', ownerUserId),
    supabase.from('user_creatures').select('*').eq('user_id', ownerUserId),
  ]);

  const powerRows = (powerRes.data ?? []) as Record<string, unknown>[];
  const techniqueRows = (techniqueRes.data ?? []) as Record<string, unknown>[];
  const itemRows = (itemRes.data ?? []) as Record<string, unknown>[];
  const creatureRows = (creatureRes.data ?? []) as Record<string, unknown>[];

  return {
    powers: powerRows.map((r) => rowToItem('powers', r, 'user')),
    techniques: techniqueRows.map((r) => rowToItem('techniques', r, 'user')),
    items: itemRows.map((r) => rowToItem('items', r, 'user')),
    creatures: creatureRows.map((r) => rowToItem('creatures', r, 'user')),
  };
}
