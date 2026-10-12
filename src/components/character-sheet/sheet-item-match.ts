/**
 * Match sheet equipment rows by id, name, or list index.
 * Equipment may be stored as { name, equipped } without a stable id.
 */

import type { Item } from '@/types';

export function matchesSheetEquipmentItem(
  item: { id?: string | number | undefined; name?: string | undefined },
  itemId: string | number,
  idx: number,
): boolean {
  const idStr = String(itemId);
  return (
    item.id === itemId ||
    String(item.id) === idStr ||
    item.name === idStr ||
    item.name?.toLowerCase() === idStr.toLowerCase() ||
    (typeof itemId === 'number' && idx === itemId)
  );
}

/** Sheet gear qty may reach 0; removal is via the row delete control only. */
export function applySheetEquipmentQuantityDelta(
  items: Item[],
  itemId: string | number,
  delta: number,
): Item[] {
  return items.flatMap((item, idx) => {
    if (!matchesSheetEquipmentItem(item, itemId, idx)) return [item];
    const newQty = Math.max(0, (item.quantity ?? 1) + delta);
    return [{ ...item, quantity: newQty }];
  });
}
