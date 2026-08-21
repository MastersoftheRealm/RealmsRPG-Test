/**
 * All / Realms Library / My Library merge for catalog lists (TASK-705 / TASK-709 / TASK-712).
 * Used by guided loadout + powers/techniques catalogs and creature creator pickers.
 * Public wins on id; optional selected draft ids stay visible after a source switch.
 *
 * `SourceFilterValue` in `shared/filters/source-filter` is an alias of this union.
 */

import { normalizeId } from '@/lib/utils';

export type LibrarySourceScope = 'all' | 'public' | 'my';

/**
 * Merge public + user rows by source. Public wins on id collision.
 * Selected ids (already on the draft) stay in the result so they can be deselected
 * after the player switches source.
 */
export function mergeLibraryBySource<T extends { id?: string | number | null | undefined }>(
  source: LibrarySourceScope,
  publicItems: T[],
  userItems: T[],
  selectedIds: string[] = [],
): T[] {
  const includePublic = source !== 'my';
  const includeUser = source !== 'public';
  const map = new Map<string, T>();

  const add = (item: T) => {
    const key = normalizeId(String(item.id ?? ''));
    if (key) map.set(key, item);
  };

  if (includeUser) userItems.forEach(add);
  if (includePublic) publicItems.forEach(add);

  if (selectedIds.length > 0) {
    const have = new Set(map.keys());
    const wanted = new Set(selectedIds.map((id) => normalizeId(id)).filter(Boolean));
    const pool = [...userItems, ...publicItems];
    for (const item of pool) {
      const key = normalizeId(String(item.id ?? ''));
      if (key && wanted.has(key) && !have.has(key)) {
        map.set(key, item);
        have.add(key);
      }
    }
  }

  return [...map.values()];
}
