/**
 * Library Items Tab — weapons, armor, or shields (My Library).
 * Entity mapping + rows; shell from ADR-0001.
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Shirt, Sword } from 'lucide-react';
import { GridListRow } from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import { propertiesProficienciesSection } from '@/lib/chip/list-row-metadata';
import { useUserItems, useItemProperties, useDuplicateItem } from '@/hooks';
import type { DisplayItem } from '@/types';
import { getItemSyncResult, sanitizeItemForSync } from '@/lib/library-sync';
import {
  ARMAMENT_LIBRARY_CONFIG,
  armamentRowColumns,
  buildOfficialItemRows,
  filterItemsByArmamentKind,
  type ArmamentLibraryKind,
} from '@/lib/library/official-item-list';
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

const LABELS_BY_KIND: Record<ArmamentLibraryKind, LibraryEntityTabLabels> = {
  weapon: WEAPON_LIBRARY_LABELS,
  armor: ARMOR_LIBRARY_LABELS,
  shield: SHIELD_LIBRARY_LABELS,
};

const ICONS_BY_KIND = {
  weapon: <Sword className="w-8 h-8" />,
  armor: <Shirt className="w-8 h-8" />,
  shield: <Shield className="w-8 h-8" />,
};

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
    [allItems, armamentKind]
  );
  const { data: propertiesDb = [] } = useItemProperties();
  const duplicateItem = useDuplicateItem();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(
    () => buildOfficialItemRows(items, propertiesDb, armamentKind),
    [items, propertiesDb, armamentKind]
  );

  const driftedIds = useMemo(
    () =>
      cardData
        .filter((item) => getItemSyncResult(item.raw, propertiesDb).hasDrift)
        .map((item) => item.id),
    [cardData, propertiesDb]
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

  const filteredData = useMemo(() => {
    let result = cardData;
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (item) =>
          String(item.name ?? '').toLowerCase().includes(searchLower) ||
          String(item.description ?? '').toLowerCase().includes(searchLower) ||
          item.parts.some((p) => String(p.name ?? '').toLowerCase().includes(searchLower))
      );
    }
    return sortItems(result);
  }, [cardData, search, sortItems]);

  return (
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
      rowChrome={{ edit: true, delete: true }}
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
    >
      {filteredData.map((item) => {
        const syncResult = getItemSyncResult(item.raw, propertiesDb);
        const family =
          armamentKind === 'armor' ? 'armor' : armamentKind === 'shield' ? 'shield' : 'weapon';
        const propertySection = propertiesProficienciesSection(item.parts, family);
        return (
          <GridListRow
            key={item.id}
            id={item.id}
            name={item.name}
            description={item.description}
            thumbnail={resolveListRowThumbnail('equipment', item.raw, item.name)}
            gridColumns={grid}
            columns={armamentRowColumns(item, armamentKind)}
            detailSections={propertySection ? [propertySection] : undefined}
            totalCost={item.tp}
            costLabel="TP"
            badges={syncResult.hasDrift ? [{ label: 'Needs sync', color: 'amber' }] : []}
            warningMessage={syncResult.issues[0]?.message}
            rightSlot={
              syncResult.hasDrift ? (
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
  );
}
