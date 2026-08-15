/**
 * Codex Equipment Tab
 * ===================
 * Mixed equipment list: Category / Currency / Rarity + ArmamentFilters extras (TASK-723).
 */

'use client';

import { useMemo, useState } from 'react';
import { SelectFilter, ArmamentFilters } from '@/components/shared/filters';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/shared';
import { EmptyState } from '@/components/ui';
import { useSort } from '@/hooks/use-sort';
import { useEquipment, useItemProperties, usePathListFilter } from '@/hooks';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import {
  buildCodexEquipmentColumns,
  buildCodexEquipmentDetailSections,
  collectCodexEquipmentFilterOptions,
  CODEX_EQUIPMENT_HEADER_COLUMNS,
  EQUIPMENT_GRID_COLUMNS,
  filterCodexEquipment,
  type CodexEquipmentListFilters,
} from '@/lib/codex/equipment-list';
import type { CodexEquipmentItem } from '@/types/codex';
import {
  EMPTY_ARMAMENT_FILTERS,
  countActiveArmamentFilters,
  type ArmamentFilterState,
} from '@/lib/library/armament-filters';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';
import {
  EQUIPMENT_LIST_PATH_KINDS,
  pathChipLabelsForEntity,
  pathFilterEmptyTitle,
} from '@/lib/game/path-recommendation-index';

function EquipmentCard({
  item,
  propertiesDb = [],
  nameChipLabels,
}: {
  item: CodexEquipmentItem;
  propertiesDb?: Parameters<typeof buildCodexEquipmentDetailSections>[1];
  nameChipLabels?: string[];
}) {
  const detailSections = useMemo(
    () => buildCodexEquipmentDetailSections(item, propertiesDb),
    [item, propertiesDb]
  );
  const nameChips = nameChipLabels?.length
    ? nameChipLabels.map((label) => ({ label }))
    : undefined;

  return (
    <GridListRow
      id={item.id}
      name={item.name}
      description={item.description}
      thumbnail={resolveListRowThumbnail('equipment', item, item.name)}
      gridColumns={EQUIPMENT_GRID_COLUMNS}
      columns={buildCodexEquipmentColumns(item)}
      detailSections={detailSections.length > 0 ? detailSections : undefined}
      badges={nameChips}
      showBadgesInName={Boolean(nameChips)}
    />
  );
}

export function CodexEquipmentTab({ codexMode = 'public' }: { codexMode?: 'public' | 'my' }) {
  const loadPublicCodex = codexMode === 'public';
  const { data: equipment, isLoading, error, refetch } = useEquipment({ enabled: loadPublicCodex });
  const { data: propertiesDb = [] } = useItemProperties({ enabled: loadPublicCodex });
  const { sortState, handleSort, sortItems } = useSort('name');
  const [listFilters, setListFilters] = useState<CodexEquipmentListFilters>({
    search: '',
    categoryFilter: '',
    rarityFilter: '',
  });
  const [armamentFilters, setArmamentFilters] = useState<ArmamentFilterState>(EMPTY_ARMAMENT_FILTERS);
  const [characterContext, setCharacterContext] = useState<ArmamentCharacterContext | null>(null);
  const {
    selectedPathIds,
    setSelectedPathIds,
    pathIndex,
    pathRecommendedIds,
    pathFilterActive,
  } = usePathListFilter({
    entities: equipment,
    kind: EQUIPMENT_LIST_PATH_KINDS,
    enabled: loadPublicCodex,
  });

  const filterOptions = useMemo(
    () => collectCodexEquipmentFilterOptions(equipment),
    [equipment]
  );

  const filteredEquipment = useMemo(() => {
    if (!equipment) return [];
    return sortItems(
      filterCodexEquipment(
        equipment,
        listFilters,
        armamentFilters,
        characterContext,
        pathRecommendedIds
      )
    );
  }, [equipment, listFilters, armamentFilters, characterContext, sortItems, pathRecommendedIds]);

  if (codexMode === 'my') {
    return (
      <EmptyState
        size="lg"
        title="My Codex: Equipment"
        description="Custom equipment lives in Library (My Library). Use Realms Codex for reference."
      />
    );
  }

  if (error) return <ErrorState message="Failed to load equipment" onRetry={() => refetch()} />;

  return (
    <CodexBrowseListShell
      search={listFilters.search}
      onSearchChange={(v) => setListFilters((f) => ({ ...f, search: v }))}
      searchPlaceholder="Search equipment..."
      filters={
        <ArmamentFilters
          value={armamentFilters}
          onChange={setArmamentFilters}
          onCharacterContextChange={setCharacterContext}
          showEquipmentExtras
          pathFilter={{
            options: pathIndex.options,
            selectedPathIds,
            onChange: setSelectedPathIds,
          }}
        >
          <SelectFilter
            label="Category"
            value={listFilters.categoryFilter}
            options={filterOptions.categories.map((c) => ({ value: c, label: c }))}
            onChange={(v) => setListFilters((f) => ({ ...f, categoryFilter: v }))}
            placeholder="All Categories"
          />
          <SelectFilter
            label="Rarity"
            value={listFilters.rarityFilter}
            options={filterOptions.rarities.map((r) => ({ value: r, label: r }))}
            onChange={(v) => setListFilters((f) => ({ ...f, rarityFilter: v }))}
            placeholder="All Rarities"
          />
        </ArmamentFilters>
      }
      filterActiveCount={
        countActiveArmamentFilters(armamentFilters, Boolean(characterContext)) +
        (pathFilterActive ? 1 : 0)
      }
      headerColumns={CODEX_EQUIPMENT_HEADER_COLUMNS}
      gridColumns={EQUIPMENT_GRID_COLUMNS}
      sortState={sortState}
      onSort={handleSort}
      hasThumbnailColumn
      isLoading={isLoading}
      isEmpty={filteredEquipment.length === 0}
      emptyTitle={pathFilterActive ? pathFilterEmptyTitle('equipment') : 'No equipment found.'}
    >
      {filteredEquipment.map((item) => (
        <EquipmentCard
          key={item.id}
          item={item}
          propertiesDb={propertiesDb}
          nameChipLabels={
            pathFilterActive
              ? pathChipLabelsForEntity(pathIndex, item.id, selectedPathIds)
              : undefined
          }
        />
      ))}
    </CodexBrowseListShell>
  );
}
