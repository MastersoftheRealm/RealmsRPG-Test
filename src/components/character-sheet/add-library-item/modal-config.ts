import type { AddLibraryItemType, PowerSelectionMode } from '@/hooks/add-library-item/types';

export function getModalGridColumns(itemType: AddLibraryItemType): string {
  switch (itemType) {
    case 'power':
      return '1.4fr 0.8fr 0.8fr 0.7fr';
    case 'technique':
      return '1.4fr 1fr 0.7fr 1fr 0.8fr';
    case 'weapon':
    case 'shield':
    case 'armor':
      return '1.5fr 1fr';
    case 'equipment':
      return '1.5fr';
    default:
      return '1.5fr';
  }
}

export function getListHeaderColumns(
  itemType: AddLibraryItemType
): { key: string; label: string; sortable?: boolean }[] {
  const base = [{ key: 'name', label: 'Name' }];
  switch (itemType) {
    case 'power':
      return [...base, { key: 'Action', label: 'Action' }, { key: 'Damage', label: 'Damage' }, { key: 'Area', label: 'Area' }];
    case 'technique':
      return [...base, { key: 'Action', label: 'Action' }, { key: 'Energy', label: 'Energy' }, { key: 'Weapon', label: 'Weapon' }, { key: 'Training Pts', label: 'Training Pts' }];
    case 'weapon':
      return [...base, { key: 'damage', label: 'Damage' }];
    case 'shield':
      return [...base, { key: 'Block', label: 'Block' }, { key: 'Damage', label: 'Damage' }];
    case 'armor':
      return [...base, { key: 'armor', label: 'Armor' }];
    case 'equipment':
      return base;
    default:
      return base;
  }
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
      return 'Add Equipment from Library';
    default:
      return 'Add Item';
  }
}

export function getSearchPlaceholder(itemType: AddLibraryItemType, powerSelectionMode: PowerSelectionMode): string {
  if (itemType === 'power' && powerSelectionMode === 'empowered') {
    return 'Search empowered techniques...';
  }
  return `Search ${itemType}s...`;
}

export const EMPOWERED_POWER_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'Action', label: 'Action' },
  { key: 'Damage', label: 'Damage' },
  { key: 'Area', label: 'Area' },
];
