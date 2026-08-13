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
import { rowToItem, toDbRow, SCALAR_KEYS, type ColumnarLibraryType } from '@/lib/library-columnar';

export interface LibraryForView {
  powers: Array<Record<string, unknown>>;
  techniques: Array<Record<string, unknown>>;
  items: Array<Record<string, unknown>>;
  creatures: Array<Record<string, unknown>>;
}

/** Library entity ids a character actually references, per library table. */
export interface OwnerLibraryRefIds {
  powers: string[];
  techniques: string[];
  items: string[];
  creatures: string[];
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

/**
 * Explicit column list: identity, timestamps, payload and the columnar scalars
 * `rowToItem` reads. Derived from SCALAR_KEYS so it cannot drift; `user_id` is
 * deliberately excluded.
 */
function viewColumns(type: ColumnarLibraryType): string {
  const scalarColumns = SCALAR_KEYS[type].map((key) => Object.keys(toDbRow({ [key]: null }))[0]);
  return ['id', 'created_at', 'updated_at', 'payload', ...scalarColumns].join(', ');
}

/** Equipment containers that may hold library item refs (array or single object). */
const EQUIPMENT_KEYS = [
  'weapons',
  'shields',
  'armor',
  'items',
  'accessories',
  'inventory',
  'mainHand',
  'offHand',
] as const;

/**
 * Refs are stored as `{ id, name }` objects today, but older saves and the two
 * roster key spellings mean the id can also arrive as a number, under `docId`,
 * or as a bare id string.
 */
function collectRefIds(value: unknown, into: Set<string>): void {
  if (value == null) return;

  if (Array.isArray(value)) {
    for (const entry of value) collectRefIds(entry, into);
    return;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const id = String(value).trim();
    if (id) into.add(id);
    return;
  }

  if (typeof value === 'object') {
    const ref = value as { id?: unknown; docId?: unknown };
    for (const candidate of [ref.id, ref.docId]) {
      if (typeof candidate === 'string' || typeof candidate === 'number') {
        const id = String(candidate).trim();
        if (id) into.add(id);
      }
    }
  }
}

function toIdArray(value: unknown): string[] {
  const ids = new Set<string>();
  collectRefIds(value, ids);
  return [...ids];
}

/**
 * Resolve the library entity ids a stored character document references.
 * Characters do not reference creatures today, so that set is always empty —
 * keep it in the shape so the response contract stays stable.
 */
export function collectCharacterLibraryRefIds(characterData: unknown): OwnerLibraryRefIds {
  const data = (characterData ?? {}) as Record<string, unknown>;
  const equipment = (data.equipment ?? {}) as Record<string, unknown>;

  const itemIds = new Set<string>();
  for (const key of EQUIPMENT_KEYS) {
    collectRefIds(equipment[key], itemIds);
  }

  return {
    powers: toIdArray(data.powers),
    techniques: toIdArray(data.techniques),
    items: [...itemIds],
    creatures: toIdArray(data.creatures),
  };
}

/** Empty result, used when a character references nothing from the owner's library. */
export function emptyLibraryForView(): LibraryForView {
  return { powers: [], techniques: [], items: [], creatures: [] };
}

async function fetchReferenced(
  supabase: ReturnType<typeof createServiceRoleClient>,
  kind: keyof OwnerLibraryRefIds,
  ownerUserId: string,
  ids: string[]
): Promise<Array<Record<string, unknown>>> {
  if (ids.length === 0) return [];

  const type = ROW_TO_ITEM_TYPE[kind];
  const { data, error } = await supabase
    .from(TABLE[kind])
    .select(viewColumns(type))
    .eq('user_id', ownerUserId)
    .in('id', ids);
  if (error) throw error;

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => rowToItem(type, row, 'user'));
}

/**
 * Fetch the owner's library rows referenced by the character being viewed.
 * Throws on a query failure so callers surface a 500 rather than an empty library.
 */
export async function getOwnerLibraryForView(
  ownerUserId: string,
  refIds: OwnerLibraryRefIds
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
