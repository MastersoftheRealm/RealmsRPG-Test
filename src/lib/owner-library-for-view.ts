/**
 * Owner Library for View
 * =======================
 * Server-only: fetches the subset of a user's library (powers, techniques, items,
 * creatures) that a specific character references, for read-only display when
 * viewing that character (public or campaign).
 * Uses Supabase (public.user_powers, user_techniques, user_items, user_creatures).
 *
 * Callers MUST verify authorization before invoking (e.g. public visibility, shared
 * campaign membership, or campaign RM roster check). This helper uses the service-role
 * client to bypass RLS on the owner's library tables — the viewer's session client
 * cannot read another user's rows.
 *
 * Authorization here is per-character, so the query must be too: `refIds` is required
 * and rows outside it are never fetched. Passing an unfiltered owner id would hand the
 * viewer the owner's whole private library (audit 2026-08-13 P0-1).
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { columnarViewSelect, rowToItem, type ColumnarLibraryType } from '@/lib/library-columnar';
import type { OwnerLibraryRefIds } from '@/lib/character-view-enrichment';

export interface LibraryForView {
  powers: Array<Record<string, unknown>>;
  techniques: Array<Record<string, unknown>>;
  items: Array<Record<string, unknown>>;
  creatures: Array<Record<string, unknown>>;
}

const TABLE: Record<keyof OwnerLibraryRefIds, string> = {
  powers: 'user_powers',
  techniques: 'user_techniques',
  items: 'user_items',
  creatures: 'user_creatures',
};

const ROW_TO_ITEM_TYPE: Record<keyof OwnerLibraryRefIds, ColumnarLibraryType> = {
  powers: 'powers',
  techniques: 'techniques',
  items: 'items',
  creatures: 'creatures',
};

/** Empty result, used when a character references nothing from the owner's library. */
export function emptyLibraryForView(): LibraryForView {
  return { powers: [], techniques: [], items: [], creatures: [] };
}

async function fetchReferenced(
  supabase: ReturnType<typeof createServiceRoleClient>,
  kind: keyof OwnerLibraryRefIds,
  ownerUserId: string,
  ids: string[],
): Promise<Array<Record<string, unknown>>> {
  if (ids.length === 0) return [];

  const type = ROW_TO_ITEM_TYPE[kind];
  const { data, error } = await supabase
    .from(TABLE[kind])
    .select(columnarViewSelect(type))
    .eq('user_id', ownerUserId)
    .in('id', ids);
  if (error) throw error;

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) =>
    rowToItem(type, row, 'user'),
  );
}

/**
 * Fetch the owner's library rows referenced by the character being viewed.
 * Throws on a query failure so callers surface a 500 rather than an empty library.
 */
export async function getOwnerLibraryForView(
  ownerUserId: string,
  refIds: OwnerLibraryRefIds,
): Promise<LibraryForView> {
  const hasRefs =
    refIds.powers.length > 0 ||
    refIds.techniques.length > 0 ||
    refIds.items.length > 0 ||
    refIds.creatures.length > 0;
  if (!hasRefs) return emptyLibraryForView();

  const supabase = createServiceRoleClient();
  const [powers, techniques, items, creatures] = await Promise.all([
    fetchReferenced(supabase, 'powers', ownerUserId, refIds.powers),
    fetchReferenced(supabase, 'techniques', ownerUserId, refIds.techniques),
    fetchReferenced(supabase, 'items', ownerUserId, refIds.items),
    fetchReferenced(supabase, 'creatures', ownerUserId, refIds.creatures),
  ]);

  return { powers, techniques, items, creatures };
}
