'use client';

import { cn, formatDamageDisplay, formatListCellLabel } from '@/lib/utils';
import {
  formatRange,
  trainingPointsForItemPropertyRef,
  type ItemPropertyPayload,
} from '@/lib/calculators/item-calc';
import {
  buildEntityMetadataDetailSections,
  mergeDetailSections,
} from '@/lib/chip/list-row-metadata';
import { toggleSort } from '@/hooks/use-sort';
import {
  SearchInput,
  GridListRow,
  QuantitySelector,
  ListHeader,
  SourceFilter,
  type ChipData,
  type SortState,
} from '@/components/shared';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import { FilterSection } from '@/components/shared/filters';
import { Button, EmptyState } from '@/components/ui';
import { TabNavigation, TabContentPanel } from '@/components/ui/tab-navigation';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import type { ItemProperty } from '@/lib/calculators/item-calc';
import {
  isPathRecommendedItem,
  type AdvancedEquipmentItem,
  type AdvancedEquipmentTabId,
  type UnarmedProwessLevel,
} from '@/lib/creator/advanced-equipment-catalog';
import {
  ARMOR_LIST_COLUMNS,
  ARMOR_LIST_GRID,
  EQUIPMENT_LIST_COLUMNS,
  EQUIPMENT_LIST_GRID,
  RIGHT_SLOT_WIDTH,
  WEAPON_LIST_COLUMNS,
  WEAPON_LIST_GRID,
} from './list-columns';
import { UnarmedProwessPanel } from './unarmed-prowess-panel';

export interface EquipmentCatalogPanelProps {
  pathMode: boolean;
  showBackToPathLoadout: boolean;
  onCollapseToPathLoadout: () => void;
  allEquipment: AdvancedEquipmentItem[];
  sortedEquipment: AdvancedEquipmentItem[];
  activeTab: AdvancedEquipmentTabId;
  onActiveTabChange: (tab: AdvancedEquipmentTabId) => void;
  currentUnarmedProwess: number;
  tabGroupId: string;
  sharedPanelId: string;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  sourceFilter: SourceFilterValue;
  onSourceFilterChange: (value: SourceFilterValue) => void;
  equipmentSort: SortState;
  onEquipmentSortChange: (sort: SortState) => void;
  remainingCurrency: number;
  startingCurrency: number;
  creationMode: string | undefined;
  recommendedArmamentRefs: Set<string>;
  recommendedEquipmentRefs: Set<string>;
  itemProperties: ItemProperty[] | undefined;
  getItemQuantity: (itemId: string) => number;
  onAddItem: (item: AdvancedEquipmentItem) => void;
  onRemoveItem: (itemId: string) => void;
  availableUnarmedLevels: UnarmedProwessLevel[];
  characterLevel: number;
  unarmedProwessTPCost: number;
  onSetUnarmedProwessLevel: (level: number) => void;
}

export function EquipmentCatalogPanel({
  pathMode,
  showBackToPathLoadout,
  onCollapseToPathLoadout,
  allEquipment,
  sortedEquipment,
  activeTab,
  onActiveTabChange,
  currentUnarmedProwess,
  tabGroupId,
  sharedPanelId,
  searchTerm,
  onSearchTermChange,
  sourceFilter,
  onSourceFilterChange,
  equipmentSort,
  onEquipmentSortChange,
  remainingCurrency,
  startingCurrency,
  creationMode,
  recommendedArmamentRefs,
  recommendedEquipmentRefs,
  itemProperties,
  getItemQuantity,
  onAddItem,
  onRemoveItem,
  availableUnarmedLevels,
  characterLevel,
  unarmedProwessTPCost,
  onSetUnarmedProwessLevel,
}: EquipmentCatalogPanelProps) {
  return (
    <>
      {pathMode && showBackToPathLoadout && (
        <div className="mb-4">
          <Button
            variant="secondary"
            onClick={onCollapseToPathLoadout}
            className="inline-flex items-center gap-2 min-h-11"
            aria-label="Back to recommended equipment view"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to path loadout
          </Button>
        </div>
      )}

      <TabNavigation
        tabs={[
          { id: 'weapon', label: 'Weapons', count: allEquipment.filter((e) => e.type === 'weapon').length },
          { id: 'armor', label: 'Armor', count: allEquipment.filter((e) => e.type === 'armor').length },
          { id: 'equipment', label: 'Equipment', count: allEquipment.filter((e) => e.type === 'equipment').length },
          {
            id: 'unarmed',
            label:
              currentUnarmedProwess > 0
                ? `Unarmed Prowess (Lv ${currentUnarmedProwess})`
                : 'Unarmed Prowess',
          },
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => onActiveTabChange(tabId as AdvancedEquipmentTabId)}
        variant="pill"
        className="mb-4"
        tabGroupId={tabGroupId}
        sharedTabPanelId={sharedPanelId}
      />

      <TabContentPanel tabGroupId={tabGroupId} id={sharedPanelId} activeTab={activeTab}>
        {activeTab === 'unarmed' ? (
          <UnarmedProwessPanel
            variant="tab"
            availableLevels={availableUnarmedLevels}
            characterLevel={characterLevel}
            currentUnarmedProwess={currentUnarmedProwess}
            unarmedProwessTPCost={unarmedProwessTPCost}
            onSetLevel={onSetUnarmedProwessLevel}
          />
        ) : (
          <>
            <div className="mb-4">
              <SearchInput
                value={searchTerm}
                onChange={onSearchTermChange}
                placeholder={`Search ${activeTab}s by name or description...`}
              />
            </div>

            <FilterSection>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SourceFilter value={sourceFilter} onChange={onSourceFilterChange} />

                <div className="filter-group">
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Budget
                  </label>
                  <div
                    className={cn(
                      'px-3 py-2 rounded-lg border text-sm',
                      remainingCurrency >= 0
                        ? 'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-600/50 text-success-fg'
                        : 'bg-danger-50 dark:bg-danger-900/30 border-danger-200 dark:border-danger-600/50 text-danger-fg'
                    )}
                  >
                    {remainingCurrency}c remaining of {startingCurrency}c
                  </div>
                </div>
              </div>
            </FilterSection>

            <div className="overflow-hidden bg-surface mb-8">
              {activeTab === 'weapon' && sortedEquipment.length > 0 && (
                <ListHeader
                  columns={WEAPON_LIST_COLUMNS}
                  gridColumns={WEAPON_LIST_GRID}
                  sortState={equipmentSort}
                  onSort={(col) => onEquipmentSortChange(toggleSort(equipmentSort, col))}
                  rightSlotWidth={RIGHT_SLOT_WIDTH}
                  hasThumbnailColumn
                />
              )}
              {activeTab === 'armor' && sortedEquipment.length > 0 && (
                <ListHeader
                  columns={ARMOR_LIST_COLUMNS}
                  gridColumns={ARMOR_LIST_GRID}
                  sortState={equipmentSort}
                  onSort={(col) => onEquipmentSortChange(toggleSort(equipmentSort, col))}
                  rightSlotWidth={RIGHT_SLOT_WIDTH}
                  hasThumbnailColumn
                />
              )}
              {activeTab === 'equipment' && sortedEquipment.length > 0 && (
                <ListHeader
                  columns={EQUIPMENT_LIST_COLUMNS}
                  gridColumns={EQUIPMENT_LIST_GRID}
                  sortState={equipmentSort}
                  onSort={(col) => onEquipmentSortChange(toggleSort(equipmentSort, col))}
                  rightSlotWidth={RIGHT_SLOT_WIDTH}
                  hasThumbnailColumn
                />
              )}
              <div className="space-y-1 max-h-[400px] overflow-y-auto">
                {sortedEquipment.length === 0 ? (
                  <EmptyState
                    size="md"
                    title={
                      activeTab === 'weapon' || activeTab === 'armor'
                        ? `No ${activeTab}s found`
                        : 'No equipment found'
                    }
                    description={
                      activeTab === 'weapon' || activeTab === 'armor'
                        ? `Create ${activeTab}s in the Item Creator to add them here.`
                        : undefined
                    }
                    icon={<AlertCircle className="w-8 h-8 text-text-muted" />}
                    action={
                      activeTab === 'weapon' || activeTab === 'armor'
                        ? {
                            label: 'Open Item Creator',
                            onClick: () => window.open('/item-creator', '_blank'),
                            variant: 'secondary' as const,
                          }
                        : undefined
                    }
                  />
                ) : (
                  sortedEquipment.map((item) => {
                    const cost = item.gold_cost || item.currency || 0;
                    const quantity = getItemQuantity(item.id);
                    const canAfford = cost <= remainingCurrency;
                    const isPathRecommended = isPathRecommendedItem(
                      item,
                      recommendedArmamentRefs,
                      recommendedEquipmentRefs
                    );

                    const badges: Array<{
                      label: string;
                      color: 'amber' | 'blue' | 'red' | 'gray';
                    }> = [];
                    if (creationMode === 'path' && isPathRecommended) {
                      badges.push({ label: 'Path Recommended', color: 'blue' });
                    }

                    const chips: ChipData[] = (item.properties || []).map((prop) => {
                      const propName = typeof prop === 'string' ? prop : prop.name || 'Property';
                      const dbProp = itemProperties?.find(
                        (p) =>
                          String(p.name ?? '').toLowerCase() === String(propName).toLowerCase()
                      );
                      const tp = trainingPointsForItemPropertyRef(prop, itemProperties ?? []);
                      const chip: ChipData = {
                        name: dbProp?.name || propName,
                        description: dbProp?.description,
                        cost: tp > 0 ? tp : undefined,
                        costLabel: 'Training Points',
                        category: tp > 0 ? 'cost' : 'default',
                      };
                      if (!tp && !dbProp?.description) chip.kind = 'descriptor';
                      return chip;
                    });

                    const maxAffordable =
                      cost > 0 ? quantity + Math.floor(remainingCurrency / cost) : 99;
                    const rightSlotContent = (
                      <QuantitySelector
                        quantity={quantity}
                        onChange={(newVal) => {
                          const diff = newVal - quantity;
                          if (diff > 0) {
                            for (let i = 0; i < diff; i++) onAddItem(item);
                          } else {
                            for (let i = 0; i < -diff; i++) onRemoveItem(item.id);
                          }
                        }}
                        min={0}
                        max={Math.min(99, maxAffordable)}
                        size="sm"
                      />
                    );

                    const sourceValue = item.source === 'library' ? 'Library' : 'Public';
                    const costColumn = {
                      key: 'gold_cost',
                      value: `${cost}c`,
                      highlight: !canAfford,
                      className: canAfford
                        ? 'text-tp-text font-bold'
                        : 'text-danger-fg font-bold',
                      align: 'right' as const,
                    };
                    const sourceColumn = {
                      key: 'source',
                      value: sourceValue,
                      hideOnMobile: true,
                      align: 'center' as const,
                    };

                    const propertySection =
                      chips.length > 0
                        ? [{ label: 'Properties', chips, hideLabelIfSingle: true as const }]
                        : undefined;

                    const thumbnail = resolveListRowThumbnail('equipment', item, item.name);

                    if (activeTab === 'weapon') {
                      const propPayloads = (item.properties ?? []) as ItemPropertyPayload[];
                      const rangeLabel = formatRange(propPayloads);
                      const rangeFacts = buildEntityMetadataDetailSections({
                        range:
                          rangeLabel && rangeLabel.toLowerCase() !== 'melee'
                            ? rangeLabel
                            : 'Melee',
                      });
                      return (
                        <GridListRow
                          key={item.id}
                          id={item.id}
                          name={item.name}
                          description={item.description}
                          thumbnail={thumbnail}
                          columns={[
                            {
                              key: 'damage',
                              value: item.damage ? formatDamageDisplay(item.damage) : '-',
                              align: 'center',
                            },
                            costColumn,
                            sourceColumn,
                          ]}
                          gridColumns={WEAPON_LIST_GRID}
                          badges={badges}
                          detailSections={mergeDetailSections(rangeFacts, propertySection)}
                          rightSlot={rightSlotContent}
                          compact
                        />
                      );
                    }
                    if (activeTab === 'armor') {
                      return (
                        <GridListRow
                          key={item.id}
                          id={item.id}
                          name={item.name}
                          description={item.description}
                          thumbnail={thumbnail}
                          columns={[
                            {
                              key: 'armor_value',
                              value: item.armor_value != null ? String(item.armor_value) : '-',
                              align: 'center',
                            },
                            costColumn,
                            sourceColumn,
                          ]}
                          gridColumns={ARMOR_LIST_GRID}
                          badges={badges}
                          detailSections={propertySection}
                          rightSlot={rightSlotContent}
                          compact
                        />
                      );
                    }
                    const categoryColumn = {
                      key: 'category',
                      value: formatListCellLabel(item.category || item.type),
                      align: 'center' as const,
                    };
                    return (
                      <GridListRow
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        description={item.description}
                        thumbnail={thumbnail}
                        columns={[categoryColumn, costColumn, sourceColumn]}
                        gridColumns={EQUIPMENT_LIST_GRID}
                        badges={badges}
                        detailSections={
                          chips.length > 0
                            ? [{ label: 'Properties', chips, hideLabelIfSingle: true }]
                            : undefined
                        }
                        rightSlot={rightSlotContent}
                        compact
                      />
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </TabContentPanel>
    </>
  );
}
