import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { UserItem, UserPower, UserTechnique } from '../use-user-library';
import { buildEmpoweredPowerSelectableItem } from './build-empowered-selectable-item';
import { buildEquipmentSelectableItem } from './build-equipment-selectable-item';
import { buildPowerSelectableItem } from './build-power-selectable-item';
import { buildTechniqueSelectableItem } from './build-technique-selectable-item';
import type { AddLibraryItemType, CodexDbRefs, EqItem, PowerSelectionMode } from './types';

export function buildSelectableItem(
  item: UserPower | UserTechnique | UserItem | EqItem,
  itemType: AddLibraryItemType,
  powerSelectionMode: PowerSelectionMode,
  dbs: CodexDbRefs
): SelectableItem {
  if (itemType === 'power' && powerSelectionMode === 'empowered') {
    return buildEmpoweredPowerSelectableItem(item as UserTechnique);
  }
  if (itemType === 'power') {
    return buildPowerSelectableItem(item as UserPower, dbs);
  }
  if (itemType === 'technique') {
    return buildTechniqueSelectableItem(item as UserTechnique, dbs);
  }
  return buildEquipmentSelectableItem(
    item as UserItem | EqItem,
    itemType as 'weapon' | 'shield' | 'armor' | 'equipment',
    dbs
  );
}
