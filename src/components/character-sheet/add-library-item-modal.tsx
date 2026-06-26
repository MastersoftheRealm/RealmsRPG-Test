/**
 * Add Library Item Modal — UnifiedSelectionModal wrapper
 * Adds powers, techniques, or items from the user's library or Realms Library to the character sheet.
 */

'use client';

import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import { useAddLibraryItemData, type AddLibraryItemType } from '@/hooks/use-add-library-item-data';
import type { CharacterPower, CharacterTechnique, Item } from '@/types';
import type { ReactNode } from 'react';
import { AddLibraryItemHeaderExtra } from './add-library-item/power-header-extra';
import { AddCustomEquipmentForm } from './add-library-item/add-custom-equipment-form';
import { mapSelectedToCharacterItems } from './add-library-item/map-selection';
import {
  EMPOWERED_POWER_COLUMNS,
  getAddLibraryItemTitle,
  getListHeaderColumns,
  getModalGridColumns,
  getSearchPlaceholder,
} from './add-library-item/modal-config';

interface AddLibraryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: AddLibraryItemType;
  existingIds: Set<string>;
  onAdd: (items: CharacterPower[] | CharacterTechnique[] | Item[]) => void;
  /** Optional modal title (e.g. innate power add flow) */
  titleOverride?: string;
}

export function AddLibraryItemModal({
  isOpen,
  onClose,
  itemType,
  existingIds,
  onAdd,
  titleOverride,
}: AddLibraryItemModalProps) {
  const {
    source,
    setSource,
    powerSelectionMode,
    setPowerSelectionMode,
    items,
    isLoading,
    displayFilterFn,
    emptyTitle,
    emptyDesc,
    dbs,
  } = useAddLibraryItemData({ itemType, existingIds });

  const handleConfirm = (selected: SelectableItem[]) => {
    onAdd(mapSelectedToCharacterItems(itemType, selected, powerSelectionMode, dbs));
  };

  const headerExtraContent: ReactNode = (
    <div className="space-y-3">
      <AddLibraryItemHeaderExtra
        source={source}
        onSourceChange={setSource}
        itemType={itemType}
        powerSelectionMode={powerSelectionMode}
        onPowerSelectionModeChange={setPowerSelectionMode}
      />
      {itemType === 'equipment' && (
        <AddCustomEquipmentForm
          onAdd={(item) => {
            onAdd([item]);
            onClose();
          }}
        />
      )}
    </div>
  );

  const columns =
    itemType === 'power' && powerSelectionMode === 'empowered'
      ? EMPOWERED_POWER_COLUMNS
      : getListHeaderColumns(itemType);

  return (
    <UnifiedSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      title={titleOverride ?? getAddLibraryItemTitle(itemType)}
      description={
        itemType === 'equipment'
          ? 'Pick from your library below, or add a custom item by name.'
          : 'Click a row (or the + button) to select, then click Add Selected.'
      }
      headerExtra={headerExtraContent}
      items={items}
      isLoading={isLoading}
      onConfirm={handleConfirm}
      displayFilter={displayFilterFn}
      columns={columns}
      gridColumns={getModalGridColumns(itemType)}
      itemLabel={itemType}
      emptyMessage={emptyTitle}
      emptySubMessage={emptyDesc}
      searchPlaceholder={getSearchPlaceholder(itemType, powerSelectionMode)}
      showQuantity={itemType === 'equipment'}
      size="lg"
      className="max-h-[60vh]"
    />
  );
}

export default AddLibraryItemModal;
