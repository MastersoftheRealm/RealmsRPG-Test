import type { Item } from '@/types';
export { matchesSheetEquipmentItem } from '@/lib/character/sheet-equipment-match';
import { matchesSheetEquipmentItem } from '@/lib/character/sheet-equipment-match';

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
