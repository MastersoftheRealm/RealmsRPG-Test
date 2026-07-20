'use client';

import { UnifiedSelectionModal, type SelectableItem } from '@/components/shared/unified-selection-modal';
import { SegmentedControl, SourceFilter, sourceFilterSummary, type SourceFilterValue } from '@/components/shared';
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
        optionsSummary={sourceFilterSummary(source)}
        optionsActiveCount={source !== 'all' ? 1 : 0}
        onConfirm={powerModalTab === 'empowered' ? onEmpoweredConfirm : onPowerConfirm}
        items={powerModalTab === 'empowered' ? allEmpoweredSelectableItems : allPowerSelectableItems}
        displayFilter={displayFilterFn}
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
        optionsSummary={sourceFilterSummary(source)}
        optionsActiveCount={source !== 'all' ? 1 : 0}
        onConfirm={onTechniqueConfirm}
        items={allTechniqueSelectableItems}
        displayFilter={displayFilterFn}
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
