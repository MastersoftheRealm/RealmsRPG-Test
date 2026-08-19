/**
 * Add Library Item Modal — UnifiedSelectionModal wrapper
 * Adds powers, techniques, or items from the user's library or Realms Library to the character sheet.
 */

'use client';

import { useMemo, useState } from 'react';
import {
  UnifiedSelectionModal,
  type SelectableItem,
} from '@/components/patterns/select/unified-selection-modal';
import { ArchetypePathFilter, PowerTechniqueFilters } from '@/components/patterns/filters';
import { sourceFilterSummary } from '@/components/patterns/filters/source-filter';
import {
  useAddLibraryItemData,
  type AddLibraryItemType,
  type PowerSelectionMode,
} from '@/hooks/use-add-library-item-data';
import { useGameRules } from '@/hooks/use-game-rules';
import { usePathListFilter } from '@/hooks';
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
import {
  applyLivePathFilter,
  EQUIPMENT_LIST_PATH_KINDS,
  pathFilterEmptyTitle,
  POWER_LIST_PATH_KINDS,
  selectableItemPathIds,
  type PathRecommendationKindInput,
} from '@/lib/game/path-recommendation-index';
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

function pathKindForAddLibraryItem(
  itemType: AddLibraryItemType,
  powerSelectionMode: PowerSelectionMode,
): PathRecommendationKindInput | null {
  if (itemType === 'power' && powerSelectionMode === 'empowered') return null;
  if (itemType === 'power') return POWER_LIST_PATH_KINDS;
  if (itemType === 'technique') return 'techniques';
  if (itemType === 'equipment') return EQUIPMENT_LIST_PATH_KINDS;
  return 'armaments';
}

function pathEmptyPlural(itemType: AddLibraryItemType): string {
  if (itemType === 'power') return 'powers';
  if (itemType === 'technique') return 'techniques';
  if (itemType === 'weapon') return 'weapons';
  if (itemType === 'armor') return 'armor';
  if (itemType === 'shield') return 'shields';
  return 'equipment';
}

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
    EMPTY_POWER_TECHNIQUE_FILTERS,
  );
  const [characterContext, setCharacterContext] = useState<PowerTechniqueCharacterContext | null>(
    null,
  );

  const showPtFilters =
    (itemType === 'power' && powerSelectionMode === 'powers') || itemType === 'technique';
  const ptKind = itemType === 'technique' ? 'technique' : 'power';
  const pathKind = pathKindForAddLibraryItem(itemType, powerSelectionMode);
  const {
    selectedPathIds,
    setSelectedPathIds,
    pathIndex,
    pathRecommendedIds: pathMatchIds,
    pathFilterActive,
  } = usePathListFilter({
    entities: items,
    kind: pathKind ?? 'powers',
    enabled: isOpen && pathKind != null,
  });

  const pathVisibleItems = useMemo(
    () =>
      pathKind
        ? applyLivePathFilter(items, {
            pathMatchIds,
            pathIndex,
            selectedPathIds,
            idsForItem: selectableItemPathIds,
          })
        : items,
    [pathKind, items, pathMatchIds, pathIndex, selectedPathIds],
  );

  const pathFilterProps = pathKind
    ? {
        options: pathIndex.options,
        selectedPathIds,
        onChange: setSelectedPathIds,
      }
    : null;

  const categoryOptions = useMemo(
    () =>
      showPtFilters
        ? collectCategoryFilterOptions(
            items.map((item) => item.powerTechniqueFilter?.categories ?? []),
          )
        : [],
    [showPtFilters, items],
  );

  const innateThresholdOptions = useMemo(
    () => (ptKind === 'power' ? listInnateThresholdFilterOptions(rules) : []),
    [ptKind, rules],
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
    ) : itemType === 'equipment' ? (
      <AddCustomEquipmentForm
        onAdd={(item) => {
          onAdd([item]);
          onClose();
        }}
      />
    ) : null;

  const filterContent = showPtFilters ? (
    <PowerTechniqueFilters
      kind={ptKind}
      value={ptFilters}
      onChange={setPtFilters}
      categoryOptions={categoryOptions}
      innateThresholdOptions={innateThresholdOptions}
      onCharacterContextChange={setCharacterContext}
      persistCharacter={false}
      pathFilter={pathFilterProps}
    />
  ) : pathFilterProps ? (
    <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <ArchetypePathFilter
        options={pathFilterProps.options}
        selectedPathIds={pathFilterProps.selectedPathIds}
        onChange={pathFilterProps.onChange}
      />
    </div>
  ) : undefined;

  const columns =
    itemType === 'power' && powerSelectionMode === 'empowered'
      ? EMPOWERED_POWER_COLUMNS
      : getListHeaderColumns(itemType);

  // Source/path live in Filters; summary/badge cover collapsed Filters state.
  const optionsSummary = sourceFilterSummary(source);
  const optionsActiveCount =
    (source !== 'all' ? 1 : 0) + ptActiveCount + (pathFilterActive ? 1 : 0);

  return (
    <UnifiedSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      title={titleOverride ?? getAddLibraryItemTitle(itemType)}
      scopeExtra={scopeExtra}
      headerExtra={<AddLibraryItemHeaderExtra source={source} onSourceChange={setSource} />}
      filterContent={filterContent}
      showFilters={Boolean(filterContent)}
      optionsSummary={optionsSummary}
      optionsActiveCount={optionsActiveCount}
      items={pathVisibleItems}
      isLoading={isLoading}
      onConfirm={handleConfirm}
      displayFilter={combinedDisplayFilter}
      columns={columns}
      gridColumns={getModalGridColumns(itemType)}
      itemLabel={itemType}
      emptyMessage={pathFilterActive ? pathFilterEmptyTitle(pathEmptyPlural(itemType)) : emptyTitle}
      emptySubMessage={emptyDesc}
      searchPlaceholder={getSearchPlaceholder(itemType, powerSelectionMode)}
      showQuantity={itemType === 'equipment'}
      size="lg"
      className="md:max-h-[60vh]"
    />
  );
}
