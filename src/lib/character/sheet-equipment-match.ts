/**
 * Match sheet equipment rows by id, name, or list index.
 * Shared by the sheet UI and autosave conflict merge (leaf lib — no UI imports).
 */

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
