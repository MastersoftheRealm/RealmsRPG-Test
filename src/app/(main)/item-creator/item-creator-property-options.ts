/**
 * Property choices for one item-creator card.
 * A property already on another card stays out of this dropdown.
 * The card's current property stays listed so the select can show it.
 */

export function propertyOptionsForCard<T extends { id: string | number }>(
  selectable: readonly T[],
  currentId: string | number,
  otherSelectedIds: readonly (string | number)[],
): T[] {
  const taken = new Set(otherSelectedIds.map((id) => String(id)));
  return selectable.filter(
    (property) => String(property.id) === String(currentId) || !taken.has(String(property.id)),
  );
}
