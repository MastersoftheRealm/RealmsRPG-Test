/**
 * Add Library Item Modal — UnifiedSelectionModal wrapper
 * Adds powers, techniques, or items from the user's library or Realms Library to the character sheet.
 */

'use client';

import { useMemo, useState } from 'react';
import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import { PowerTechniqueFilters } from '@/components/shared/filters';
import { sourceFilterSummary } from '@/components/shared/filters/source-filter';
import { useAddLibraryItemData, type AddLibraryItemType } from '@/hooks/use-add-library-item-data';
import { useGameRules } from '@/hooks/use-game-rules';
import { listInnateThresholdFilterOptions } from '@/lib/game/innate-eligibility';
import {
  applyPowerTechniqueFilters,
  countActivePowerTechniqueFilters,
  EMPTY_POWER_TECHNIQUE_FILTERS,
  type PowerTechniqueFilterState,
} from '@/lib/library/power-technique-filters';
import type { PowerTechniqueCharacterContext } from '@/lib/library/power-technique-character-context';
import { collectCategoryFilterOptions } from '@/lib/library/power-technique-categories';
import type { CharacterPower, CharacterTechnique, Item } from '@/types';
import type { ReactNode } from 'react';
import {
  AddLibraryItemHeaderExtra,
  AddLibraryItemScopeExtra,
} from './add-library-item/power-header-extra';
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

  const { rules } = useGameRules();
  const [ptFilters, setPtFilters] = useState<PowerTechniqueFilterState>(
    EMPTY_POWER_TECHNIQUE_FILTERS
  );
  const [characterContext, setCharacterContext] =
    useState<PowerTechniqueCharacterContext | null>(null);

  const showPtFilters =
    (itemType === 'power' && powerSelectionMode === 'powers') || itemType === 'technique';
  const ptKind = itemType === 'technique' ? 'technique' : 'power';

  const categoryOptions = useMemo(
    () =>
      showPtFilters
        ? collectCategoryFilterOptions(
            items.map((item) => item.powerTechniqueFilter?.categories ?? [])
          )
        : [],
    [showPtFilters, items]
  );

  const innateThresholdOptions = useMemo(
    () => (ptKind === 'power' ? listInnateThresholdFilterOptions(rules) : []),
    [ptKind, rules]
  );

  const hasCharacter = Boolean(characterContext);
  const ptActiveCount = showPtFilters
    ? countActivePowerTechniqueFilters(ptFilters, ptKind, hasCharacter)
    : 0;

  const combinedDisplayFilter = useMemo(() => {
    return (item: SelectableItem) => {
      if (!displayFilterFn(item)) return false;
      if (!showPtFilters) return true;
      if (ptActiveCount === 0 && !hasCharacter) return true;
      const row = item.powerTechniqueFilter;
      if (!row) return true;
      return applyPowerTechniqueFilters([row], ptFilters, ptKind, characterContext).length > 0;
    };
  }, [
    displayFilterFn,
    showPtFilters,
    ptActiveCount,
    hasCharacter,
    ptFilters,
    ptKind,
    characterContext,
  ]);

  const handleConfirm = (selected: SelectableItem[]) => {
    onAdd(mapSelectedToCharacterItems(itemType, selected, powerSelectionMode, dbs));
  };

  const scopeExtra =
    itemType === 'power' ? (
      <AddLibraryItemScopeExtra
        itemType={itemType}
        powerSelectionMode={powerSelectionMode}
        onPowerSelectionModeChange={setPowerSelectionMode}
      />
    ) : null;

  const headerExtraContent: ReactNode = (
    <div className="space-y-3">
      <AddLibraryItemHeaderExtra source={source} onSourceChange={setSource} />
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

  const filterContent = showPtFilters ? (
    <PowerTechniqueFilters
      kind={ptKind}
      value={ptFilters}
      onChange={setPtFilters}
      categoryOptions={categoryOptions}
      innateThresholdOptions={innateThresholdOptions}
      onCharacterContextChange={setCharacterContext}
      persistCharacter={false}
    />
  ) : undefined;

  const columns =
    itemType === 'power' && powerSelectionMode === 'empowered'
      ? EMPOWERED_POWER_COLUMNS
      : getListHeaderColumns(itemType);

  // Mode tabs are always visible; summary/badge cover Filters-only state (source + P/T).
  const optionsSummary = sourceFilterSummary(source);
  const optionsActiveCount = (source !== 'all' ? 1 : 0) + ptActiveCount;

  return (
    <UnifiedSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      title={titleOverride ?? getAddLibraryItemTitle(itemType)}
      {...(itemType === 'equipment'
        ? { description: 'Open Filters to add a custom item by name.' }
        : {})}
      scopeExtra={scopeExtra}
      headerExtra={headerExtraContent}
      filterContent={filterContent}
      optionsSummary={optionsSummary}
      optionsActiveCount={optionsActiveCount}
      items={items}
      isLoading={isLoading}
      onConfirm={handleConfirm}
      displayFilter={combinedDisplayFilter}
      columns={columns}
      gridColumns={getModalGridColumns(itemType)}
      itemLabel={itemType}
      emptyMessage={emptyTitle}
      emptySubMessage={emptyDesc}
      searchPlaceholder={getSearchPlaceholder(itemType, powerSelectionMode)}
      showQuantity={itemType === 'equipment'}
      size="lg"
      className="md:max-h-[60vh]"
    />
  );
}
