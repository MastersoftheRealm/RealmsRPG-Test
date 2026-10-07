/**
 * Property choices for the item creator.
 * A property already on the item cannot be added again.
 * A card's dropdown still lists its own current property.
 */

import { isGeneralProperty, isMechanicProperty } from '@/lib/calculators';

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

type AddableProperty = {
  id: string | number;
  name?: string | undefined;
  type?: string | null | undefined;
  mechanic?: boolean | undefined;
};

/** Next property Add Property can attach, or null when every selectable property is used. */
export function findAddableItemProperty<T extends AddableProperty>(
  itemProperties: readonly T[],
  armamentType: string,
  selectedIds: readonly (string | number)[],
): T | null {
  const armamentTypeLower = armamentType.toLowerCase();
  const selectable = itemProperties.filter((property) => {
    if (isGeneralProperty(property)) return false;
    if (isMechanicProperty(property)) return false;
    const propType = (property.type || '').toLowerCase();
    if (!propType || propType === 'general') return true;
    return propType === armamentTypeLower;
  });
  const taken = new Set(selectedIds.map((id) => String(id)));
  return selectable.find((property) => !taken.has(String(property.id))) ?? null;
}
