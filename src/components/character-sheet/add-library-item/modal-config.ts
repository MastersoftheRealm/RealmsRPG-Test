import type { AddLibraryItemType, PowerSelectionMode } from '@/hooks/add-library-item/types';
import {
  EMPOWERED_POWER_COLUMNS as SHARED_EMPOWERED_POWER_COLUMNS,
  getListHeaderColumns as getSharedListHeaderColumns,
  getModalGridColumns as getSharedModalGridColumns,
  type LibraryItemType,
} from '@/lib/library-selectable-builders';

export function getModalGridColumns(itemType: AddLibraryItemType): string {
  return getSharedModalGridColumns(itemType as LibraryItemType);
}

export function getListHeaderColumns(
  itemType: AddLibraryItemType,
): { key: string; label: string; sortable?: boolean | undefined }[] {
  return getSharedListHeaderColumns(itemType as LibraryItemType).map(
    ({ key, label, sortable }) => ({
      key,
      label,
      sortable,
    }),
  );
}

export function getAddLibraryItemTitle(itemType: AddLibraryItemType): string {
  switch (itemType) {
    case 'power':
      return 'Add Power from Library';
    case 'technique':
      return 'Add Technique from Library';
    case 'weapon':
      return 'Add Weapon from Library';
    case 'shield':
      return 'Add Shield from Library';
    case 'armor':
      return 'Add Armor from Library';
    case 'equipment':
      return 'Add to Inventory';
    default:
      return 'Add Item';
  }
}

export function getSearchPlaceholder(
  itemType: AddLibraryItemType,
  powerSelectionMode: PowerSelectionMode,
): string {
  if (itemType === 'power' && powerSelectionMode === 'empowered') {
    return 'Search empowered techniques...';
  }
  return `Search ${itemType}s...`;
}

export const EMPOWERED_POWER_COLUMNS = SHARED_EMPOWERED_POWER_COLUMNS;
