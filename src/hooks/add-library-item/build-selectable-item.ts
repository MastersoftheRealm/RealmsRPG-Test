import type { SelectableItem } from '@/components/patterns/select/unified-selection-modal';
import {
  buildSelectableItem as buildSharedSelectableItem,
  type BuildSelectableItemCodex,
  type LibraryItemType,
} from '@/lib/library-selectable-builders';
import type { UserItem, UserPower, UserTechnique } from '../use-user-library';
import {
  buildEmpoweredPowerSelectableItem,
  type EmpoweredSelectableCodex,
} from './build-empowered-selectable-item';
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
  dbs: CodexDbRefs,
): SelectableItem {
  if (itemType === 'power' && powerSelectionMode === 'empowered') {
    return buildEmpoweredPowerSelectableItem(item as UserTechnique, {
      powerPartsDb: dbs.powerPartsDb as EmpoweredSelectableCodex['powerPartsDb'],
      techniquePartsDb: dbs.techniquePartsDb as EmpoweredSelectableCodex['techniquePartsDb'],
    });
  }
  return buildSharedSelectableItem(item, itemType as LibraryItemType, toCodex(dbs));
}
