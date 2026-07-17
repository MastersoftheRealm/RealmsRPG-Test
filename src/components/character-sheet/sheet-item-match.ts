/**
 * Match sheet equipment rows by id, name, or list index.
 * Equipment may be stored as { name, equipped } without a stable id.
 */

export function matchesSheetEquipmentItem(
  item: { id?: string | number; name?: string },
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
