/**
 * Library Items Tab — weapons, armor, or shields (My Library).
 * Entity mapping + rows; shell from ADR-0001.
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Shirt, Sword } from 'lucide-react';
import {
  GridListRow,
  LibraryAddToCharacterButton,
  LibraryRowActionSlot,
} from '@/components/shared';
import { ArmamentFilters } from '@/components/shared/filters';
import { useSort } from '@/hooks/use-sort';
import { useAddToCharacterFromLibrary } from '@/hooks/use-add-to-character-from-library';
import { usePathListFilter } from '@/hooks';
import { propertiesProficienciesSection } from '@/lib/chip/list-row-metadata';
import { useUserItems, useItemProperties, useDuplicateItem } from '@/hooks';
import type { DisplayItem } from '@/types';
import { getItemSyncResult, sanitizeItemForSync } from '@/lib/library-sync';
import {
  ARMAMENT_LIBRARY_CONFIG,
  armamentRowColumns,
  buildOfficialItemRows,
  filterItemsByArmamentKind,
  filterOfficialItemRows,
  type ArmamentLibraryKind,
} from '@/lib/library/official-item-list';
import {
  EMPTY_ARMAMENT_FILTERS,
  countActiveArmamentFilters,
  type ArmamentFilterState,
} from '@/lib/library/armament-filters';
import type { ArmamentCharacterContext } from '@/lib/library/armament-character-context';
import {
  LibrarySyncRowAction,
  UserLibraryEntityTabShell,
} from './components/UserLibraryEntityTabShell';
import {
  ARMOR_LIBRARY_LABELS,
  SHIELD_LIBRARY_LABELS,
  WEAPON_LIBRARY_LABELS,
  type LibraryEntityTabLabels,
} from './components/library-entity-tab.types';
import { useLibraryEntitySync } from './hooks/use-library-entity-sync';
import { useLibraryDuplicateConfirm } from './hooks/use-library-duplicate-confirm';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import {
  libraryRowPathIds,
  pathChipLabelsForEntity,
  pathFilterEmptyTitle,
} from '@/lib/game/path-recommendation-index';

const LABELS_BY_KIND: Record<ArmamentLibraryKind, LibraryEntityTabLabels> = {
  weapon: WEAPON_LIBRARY_LABELS,
  armor: ARMOR_LIBRARY_LABELS,
  shield: SHIELD_LIBRARY_LABELS,
};

const ICONS_BY_KIND = {
  weapon: <Sword className="h-8 w-8" />,
  armor: <Shirt className="h-8 w-8" />,
  shield: <Shield className="h-8 w-8" />,
};

const ARMAMENT_ROW_CHROME = { edit: true, delete: true, rightSlot: true } as const;

interface LibraryItemsTabProps {
  armamentKind: ArmamentLibraryKind;
  onDelete: (item: DisplayItem) => void;
}

export function LibraryItemsTab({ armamentKind, onDelete }: LibraryItemsTabProps) {
  const router = useRouter();
  const labels = LABELS_BY_KIND[armamentKind];
  const { grid, headers } = ARMAMENT_LIBRARY_CONFIG[armamentKind];
  const { data: allItems = [], isLoading, error, refetch } = useUserItems();
  const items = useMemo(
    () => filterItemsByArmamentKind(allItems, armamentKind),
    [allItems, armamentKind],
  );
  const { data: propertiesDb = [] } = useItemProperties();
  const duplicateItem = useDuplicateItem();
  const [search, setSearch] = useState('');
  const [advancedFilters, setAdvancedFilters] =
    useState<ArmamentFilterState>(EMPTY_ARMAMENT_FILTERS);
  const [characterContext, setCharacterContext] = useState<ArmamentCharacterContext | null>(null);
  const [characterFilterId, setCharacterFilterId] = useState('');
  const addToCharacter = useAddToCharacterFromLibrary(armamentKind, characterFilterId);
  const { sortState, handleSort, sortItems } = useSort('name');
  const { selectedPathIds, setSelectedPathIds, pathIndex, pathRecommendedIds, pathFilterActive } =
    usePathListFilter({ entities: items, kind: 'armaments' });

  const cardData = useMemo(
    () => buildOfficialItemRows(items, propertiesDb, armamentKind),
    [items, propertiesDb, armamentKind],
  );

  const driftedIds = useMemo(
    () =>
      cardData
        .filter((item) => getItemSyncResult(item.raw, propertiesDb).hasDrift)
        .map((item) => item.id),
    [cardData, propertiesDb],
  );

  const sync = useLibraryEntitySync({
    saveType: 'items',
    sources: items,
    getRowId: (i) => String(i.docId ?? i.id ?? ''),
    getRowName: (i) => String(i.name ?? ''),
    driftedIds,
    sanitize: (source) => sanitizeItemForSync(source, propertiesDb),
    refetch,
    entitySingular: labels.entitySingular,
    entityPlural: labels.entityPlural,
  });

  const dup = useLibraryDuplicateConfirm({
    duplicateTitle: labels.duplicateTitle,
    isPending: duplicateItem.isPending,
    mutate: (id, handlers) => duplicateItem.mutate(id, handlers),
  });

  const filteredData = useMemo(
    () =>
      filterOfficialItemRows(
        cardData,
        search,
        sortItems,
        advancedFilters,
        characterContext,
        pathRecommendedIds,
      ),
    [cardData, search, sortItems, advancedFilters, characterContext, pathRecommendedIds],
  );

  return (
    <>
      <UserLibraryEntityTabShell
        labels={labels}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        totalCount={cardData.length}
        emptyIcon={ICONS_BY_KIND[armamentKind]}
        search={search}
        onSearchChange={setSearch}
        sortState={sortState}
        onSort={handleSort}
        headerColumns={headers}
        gridColumns={grid}
        hasThumbnailColumn
        rowChrome={ARMAMENT_ROW_CHROME}
        filteredCount={filteredData.length}
        driftedCount={sync.driftedCount}
        syncingAll={sync.syncingAll}
        showSyncAllConfirm={sync.showSyncAllConfirm}
        onOpenSyncAllConfirm={() => sync.setShowSyncAllConfirm(true)}
        onCloseSyncAllConfirm={() => sync.setShowSyncAllConfirm(false)}
        onConfirmSyncAll={() => {
          sync.setShowSyncAllConfirm(false);
          void sync.handleSyncAll();
        }}
        duplicateConfirm={dup.duplicateConfirm}
        onCloseDuplicate={dup.closeDuplicateConfirm}
        onConfirmDuplicate={dup.onConfirmDuplicate}
        duplicatePending={dup.isPending}
        filters={
          <ArmamentFilters
            value={advancedFilters}
            onChange={setAdvancedFilters}
            onCharacterContextChange={setCharacterContext}
            onCharacterIdChange={setCharacterFilterId}
            pathFilter={{
              options: pathIndex.options,
              selectedPathIds,
              onChange: setSelectedPathIds,
            }}
          />
        }
        filterActiveCount={
          countActiveArmamentFilters(advancedFilters, Boolean(characterContext)) +
          (pathFilterActive ? 1 : 0)
        }
        filterEmptyTitle={pathFilterActive ? pathFilterEmptyTitle(labels.entityPlural) : undefined}
      >
        {filteredData.map((item) => {
          const syncResult = getItemSyncResult(item.raw, propertiesDb);
          const family =
            armamentKind === 'armor' ? 'armor' : armamentKind === 'shield' ? 'shield' : 'weapon';
          const propertySection = propertiesProficienciesSection(item.parts, family);
          const nameLabels = pathFilterActive
            ? pathChipLabelsForEntity(pathIndex, libraryRowPathIds(item), selectedPathIds)
            : undefined;
          const nameBadges = nameLabels?.map((label) => ({ label })) ?? [];
          const driftBadges = syncResult.hasDrift
            ? [{ label: 'Needs sync' as const, color: 'amber' as const }]
            : [];
          const badges = [...nameBadges, ...driftBadges];
          return (
            <GridListRow
              key={item.id}
              id={item.id}
              name={item.name}
              description={item.description}
              thumbnail={resolveListRowThumbnail('equipment', item.raw, item.name)}
              gridColumns={grid}
              rowChrome={ARMAMENT_ROW_CHROME}
              columns={armamentRowColumns(item, armamentKind)}
              detailSections={propertySection ? [propertySection] : undefined}
              totalCost={item.tp}
              costLabel="TP"
              badges={badges.length > 0 ? badges : undefined}
              showBadgesInName={nameBadges.length > 0}
              warningMessage={syncResult.issues[0]?.message}
              rightSlot={
                addToCharacter.active && !addToCharacter.isOnCharacter(item.raw) ? (
                  <LibraryRowActionSlot>
                    <LibraryAddToCharacterButton
                      kind={armamentKind}
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCharacter.openAddConfirm(item.name, item.raw);
                      }}
                    />
                    {syncResult.hasDrift ? (
                      <LibrarySyncRowAction
                        syncing={sync.syncingIds.has(item.id)}
                        onSync={() => void sync.handleSyncOne(item.id)}
                      />
                    ) : null}
                  </LibraryRowActionSlot>
                ) : syncResult.hasDrift ? (
                  <LibrarySyncRowAction
                    syncing={sync.syncingIds.has(item.id)}
                    onSync={() => void sync.handleSyncOne(item.id)}
                  />
                ) : undefined
              }
              onEdit={() => router.push(`/item-creator?edit=${encodeURIComponent(item.id)}`)}
              onDelete={() => onDelete({ id: item.id, name: item.name } as DisplayItem)}
              onDuplicate={() => dup.openDuplicateConfirm(item.id, item.name)}
            />
          );
        })}
      </UserLibraryEntityTabShell>
      {addToCharacter.confirmModal}
    </>
  );
}
