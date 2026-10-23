import type { SelectableItem } from './unified-selection-modal-types';

/** Stamp the stepper counts onto selected rows so spend math sees every copy. */
export function itemsWithSelectionQuantity(
  items: SelectableItem[],
  quantities: Record<string, number>,
): SelectableItem[] {
  return items.map((item) => {
    const raw = quantities[String(item.id)];
    const quantity = Math.max(1, Math.floor(Number(raw)) || 1);
    return { ...item, quantity };
  });
}

/** True when current selection/quantities differ from the modal’s open seed (TASK-574). */
export function selectionDiffersFromInitial(
  selectedIds: Set<string>,
  initialIds: Set<string>,
  showQuantity: boolean,
  quantities: Record<string, number>,
  initialQuantities: Record<string, number>,
): boolean {
  if (selectedIds.size === 0) return false;
  if (selectedIds.size !== initialIds.size) return true;
  for (const id of selectedIds) {
    if (!initialIds.has(id)) return true;
  }
  if (!showQuantity) return false;
  for (const id of selectedIds) {
    const current = quantities[id] ?? 1;
    const seeded = initialQuantities[id] ?? initialQuantities[id.toLowerCase()] ?? 1;
    const normalizedSeed = Math.max(1, Math.floor(Number(seeded)) || 1);
    if (current !== normalizedSeed) return true;
  }
  return false;
}
