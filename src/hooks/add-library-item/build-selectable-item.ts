import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import {
  buildSelectableItem as buildSharedSelectableItem,
  type BuildSelectableItemCodex,
  type LibraryItemType,
} from '@/lib/library-selectable-builders';
import type { UserItem, UserPower, UserTechnique } from '../use-user-library';
import { buildEmpoweredPowerSelectableItem } from './build-empowered-selectable-item';
import type { AddLibraryItemType, CodexDbRefs, EqItem, PowerSelectionMode } from './types';

function toCodex(dbs: CodexDbRefs): BuildSelectableItemCodex {
  return {
    powerPartsDb: dbs.powerPartsDb as BuildSelectableItemCodex['powerPartsDb'],
    techniquePartsDb: dbs.techniquePartsDb as BuildSelectableItemCodex['techniquePartsDb'],
    itemPropertiesDb: dbs.itemPropertiesDb as BuildSelectableItemCodex['itemPropertiesDb'],
  };
}

/**
 * Add-library dispatcher — empowered powers stay local; all other types use the shared
 * `library-selectable-builders` pipeline (same shaping as Load From Library).
 */
export function buildSelectableItem(
  item: UserPower | UserTechnique | UserItem | EqItem,
  itemType: AddLibraryItemType,
  powerSelectionMode: PowerSelectionMode,
  dbs: CodexDbRefs
): SelectableItem {
  if (itemType === 'power' && powerSelectionMode === 'empowered') {
    return buildEmpoweredPowerSelectableItem(item as UserTechnique);
  }
  return buildSharedSelectableItem(item, itemType as LibraryItemType, toCodex(dbs));
}
