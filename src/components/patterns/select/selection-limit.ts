/** True when another selected row would pass maxSelections, including max 0. */
export function selectionAddBlocked(
  currentCount: number,
  maxSelections: number | undefined,
): boolean {
  return maxSelections !== undefined && currentCount >= maxSelections;
}
