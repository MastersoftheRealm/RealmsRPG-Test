'use client';

import { useMemo, useState } from 'react';
import {
  UnifiedSelectionModal,
  type SelectableItem,
} from '@/components/patterns/select/unified-selection-modal';
import {
  PowerTechniqueFilters,
  SegmentedControl,
  SourceFilter,
  sourceFilterSummary,
  type SourceFilterValue,
} from '@/components/patterns';
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
import {
  POWER_GRID_COLUMNS,
  POWER_MODAL_COLUMNS,
  TECHNIQUE_GRID_COLUMNS,
  TECHNIQUE_MODAL_COLUMNS,
  type PowerModalTab,
} from './modal-columns';

export interface PowersSelectionModalsProps {
  showPowerModal: boolean;
  showTechniqueModal: boolean;
  onClosePowerModal: () => void;
  onCloseTechniqueModal: () => void;
  powerModalTab: PowerModalTab;
  onPowerModalTabChange: (tab: PowerModalTab) => void;
  source: SourceFilterValue;
  onSourceChange: (value: SourceFilterValue) => void;
  displayFilterFn: (item: SelectableItem) => boolean;
  onPowerConfirm: (items: SelectableItem[]) => void;
  onEmpoweredConfirm: (items: SelectableItem[]) => void;
  onTechniqueConfirm: (items: SelectableItem[]) => void;
  allPowerSelectableItems: SelectableItem[];
  allEmpoweredSelectableItems: SelectableItem[];
  allTechniqueSelectableItems: SelectableItem[];
  selectedPowerIds: Set<string>;
  selectedTechniqueIds: Set<string>;
  powersModalLoading: boolean;
  empoweredModalLoading: boolean;
  techniquesModalLoading: boolean;
  powerModalEmptyMessage?: string;
  powerModalEmptySubMessage?: string;
  techniqueModalEmptyMessage?: string;
  techniqueModalEmptySubMessage?: string;
  publicEmpoweredTechniquesError: boolean;
}

export function PowersSelectionModals({
  showPowerModal,
  showTechniqueModal,
  onClosePowerModal,
  onCloseTechniqueModal,
  powerModalTab,
  onPowerModalTabChange,
  source,
  onSourceChange,
  displayFilterFn,
  onPowerConfirm,
  onEmpoweredConfirm,
  onTechniqueConfirm,
  allPowerSelectableItems,
  allEmpoweredSelectableItems,
  allTechniqueSelectableItems,
  selectedPowerIds,
  selectedTechniqueIds,
  powersModalLoading,
  empoweredModalLoading,
  techniquesModalLoading,
  powerModalEmptyMessage,
  powerModalEmptySubMessage,
  techniqueModalEmptyMessage,
  techniqueModalEmptySubMessage,
  publicEmpoweredTechniquesError,
}: PowersSelectionModalsProps) {
  const { rules } = useGameRules();
  const [powerFilters, setPowerFilters] = useState<PowerTechniqueFilterState>(
    EMPTY_POWER_TECHNIQUE_FILTERS,
  );
  const [techniqueFilters, setTechniqueFilters] = useState<PowerTechniqueFilterState>(
    EMPTY_POWER_TECHNIQUE_FILTERS,
  );
  const [powerCharacterCtx, setPowerCharacterCtx] = useState<PowerTechniqueCharacterContext | null>(
    null,
  );
  const [techniqueCharacterCtx, setTechniqueCharacterCtx] =
    useState<PowerTechniqueCharacterContext | null>(null);

  const showPowerPtFilters = powerModalTab === 'powers';
  const powerCategoryOptions = useMemo(
    () =>
      showPowerPtFilters
        ? collectCategoryFilterOptions(
            allPowerSelectableItems.map((item) => item.powerTechniqueFilter?.categories ?? []),
          )
        : [],
    [showPowerPtFilters, allPowerSelectableItems],
  );
  const techniqueCategoryOptions = useMemo(
    () =>
      collectCategoryFilterOptions(
        allTechniqueSelectableItems.map((item) => item.powerTechniqueFilter?.categories ?? []),
      ),
    [allTechniqueSelectableItems],
  );
  const innateThresholdOptions = useMemo(() => listInnateThresholdFilterOptions(rules), [rules]);

  const powerPtActive = showPowerPtFilters
    ? countActivePowerTechniqueFilters(powerFilters, 'power', Boolean(powerCharacterCtx))
    : 0;
  const techniquePtActive = countActivePowerTechniqueFilters(
    techniqueFilters,
    'technique',
    Boolean(techniqueCharacterCtx),
  );

  const powerDisplayFilter = useMemo(() => {
    return (item: SelectableItem) => {
      if (!displayFilterFn(item)) return false;
      if (!showPowerPtFilters) return true;
      if (powerPtActive === 0 && !powerCharacterCtx) return true;
      const row = item.powerTechniqueFilter;
      if (!row) return true;
      return applyPowerTechniqueFilters([row], powerFilters, 'power', powerCharacterCtx).length > 0;
    };
  }, [displayFilterFn, showPowerPtFilters, powerPtActive, powerCharacterCtx, powerFilters]);

  const techniqueDisplayFilter = useMemo(() => {
    return (item: SelectableItem) => {
      if (!displayFilterFn(item)) return false;
      if (techniquePtActive === 0 && !techniqueCharacterCtx) return true;
      const row = item.powerTechniqueFilter;
      if (!row) return true;
      return (
        applyPowerTechniqueFilters([row], techniqueFilters, 'technique', techniqueCharacterCtx)
          .length > 0
      );
    };
  }, [displayFilterFn, techniquePtActive, techniqueCharacterCtx, techniqueFilters]);

  const sourceActive = source !== 'all' ? 1 : 0;

  return (
    <>
      <UnifiedSelectionModal
        isOpen={showPowerModal}
        onClose={onClosePowerModal}
        scopeExtra={
          <SegmentedControl<PowerModalTab>
            value={powerModalTab}
            onChange={onPowerModalTabChange}
            aria-label="Power modal type"
            tabs
            options={[
              { value: 'powers', label: 'Powers' },
              { value: 'empowered', label: 'Empowered Techniques' },
            ]}
          />
        }
        headerExtra={<SourceFilter value={source} onChange={onSourceChange} />}
        filterContent={
          showPowerPtFilters ? (
            <PowerTechniqueFilters
              kind="power"
              value={powerFilters}
              onChange={setPowerFilters}
              categoryOptions={powerCategoryOptions}
              innateThresholdOptions={innateThresholdOptions}
              onCharacterContextChange={setPowerCharacterCtx}
              persistCharacter={false}
            />
          ) : undefined
        }
        optionsSummary={sourceFilterSummary(source)}
        optionsActiveCount={sourceActive + powerPtActive}
        onConfirm={powerModalTab === 'empowered' ? onEmpoweredConfirm : onPowerConfirm}
        items={
          powerModalTab === 'empowered' ? allEmpoweredSelectableItems : allPowerSelectableItems
        }
        displayFilter={powerDisplayFilter}
        title={powerModalTab === 'empowered' ? 'Select Empowered Techniques' : 'Select Powers'}
        initialSelectedIds={selectedPowerIds}
        searchPlaceholder={
          powerModalTab === 'empowered' ? 'Search empowered techniques...' : 'Search powers...'
        }
        itemLabel={powerModalTab === 'empowered' ? 'empowered technique' : 'power'}
        isLoading={powerModalTab === 'empowered' ? empoweredModalLoading : powersModalLoading}
        emptyMessage={powerModalTab === 'empowered' ? undefined : powerModalEmptyMessage}
        emptySubMessage={
          powerModalTab === 'empowered'
            ? source === 'public' && publicEmpoweredTechniquesError
              ? 'Failed to load Realms Library. Check your connection and try again.'
              : undefined
            : powerModalEmptySubMessage
        }
        columns={POWER_MODAL_COLUMNS}
        gridColumns={POWER_GRID_COLUMNS}
      />

      <UnifiedSelectionModal
        isOpen={showTechniqueModal}
        onClose={onCloseTechniqueModal}
        headerExtra={<SourceFilter value={source} onChange={onSourceChange} />}
        filterContent={
          <PowerTechniqueFilters
            kind="technique"
            value={techniqueFilters}
            onChange={setTechniqueFilters}
            categoryOptions={techniqueCategoryOptions}
            onCharacterContextChange={setTechniqueCharacterCtx}
            persistCharacter={false}
          />
        }
        optionsSummary={sourceFilterSummary(source)}
        optionsActiveCount={sourceActive + techniquePtActive}
        onConfirm={onTechniqueConfirm}
        items={allTechniqueSelectableItems}
        displayFilter={techniqueDisplayFilter}
        title="Select Techniques"
        initialSelectedIds={selectedTechniqueIds}
        searchPlaceholder="Search techniques..."
        itemLabel="technique"
        isLoading={techniquesModalLoading}
        emptyMessage={techniqueModalEmptyMessage}
        emptySubMessage={techniqueModalEmptySubMessage}
        columns={TECHNIQUE_MODAL_COLUMNS}
        gridColumns={TECHNIQUE_GRID_COLUMNS}
      />
    </>
  );
}
