/**
 * Library Items (Armaments) Tab — entity mapping + rows; shell from ADR-0001.
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { GridListRow, type ChipData } from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import type { ItemPropertyPayload } from '@/lib/calculators/item-calc';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  formatRange as formatItemRange,
} from '@/lib/calculators/item-calc';
import { namedPropertyDescriptorChips } from '@/lib/detail-option/compact-facts';
import { formatDamageDisplay, formatListCellLabel } from '@/lib/utils';
import { useUserItems, useItemProperties, useDuplicateItem } from '@/hooks';
import type { DisplayItem } from '@/types';
import { getItemSyncResult, sanitizeItemForSync } from '@/lib/library-sync';
import {
  LibrarySyncRowAction,
  UserLibraryEntityTabShell,
} from './components/UserLibraryEntityTabShell';
import { ARMAMENT_LIBRARY_LABELS } from './components/library-entity-tab.types';
import { useLibraryEntitySync } from './hooks/use-library-entity-sync';
import { useLibraryDuplicateConfirm } from './hooks/use-library-duplicate-confirm';

const ARMAMENT_GRID_COLUMNS = '1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 40px';
const ARMAMENT_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const },
  { key: 'type', label: 'TYPE', align: 'center' as const },
  { key: 'rarity', label: 'RARITY', align: 'center' as const },
  { key: 'currency', label: 'CURRENCY', align: 'center' as const },
  { key: 'tp', label: 'TP', align: 'center' as const },
  { key: 'range', label: 'RANGE', align: 'center' as const },
  { key: 'damage', label: 'DAMAGE', align: 'center' as const },
  { key: '_actions', label: '', sortable: false as const },
];

interface LibraryItemsTabProps {
  onDelete: (item: DisplayItem) => void;
}

export function LibraryItemsTab({ onDelete }: LibraryItemsTabProps) {
  const router = useRouter();
  const { data: items = [], isLoading, error, refetch } = useUserItems();
  const { data: propertiesDb = [] } = useItemProperties();
  const duplicateItem = useDuplicateItem();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return (items || []).map((item) => {
      const props = (Array.isArray(item.properties) ? item.properties : []) as ItemPropertyPayload[];
      const costs = calculateItemCosts(props, propertiesDb);
      const syncResult = getItemSyncResult(item, propertiesDb);
      const { currencyCost, rarity } = calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP);
      const rangeStr = formatItemRange(props);
      const parts: ChipData[] = namedPropertyDescriptorChips(
        (item.properties || []) as Array<string | { id?: unknown; name?: string; op_1_lvl?: number }>,
        propertiesDb
      ).map((chip) => {
        const prop = (
          (item.properties || []) as Array<string | { id?: unknown; name?: string; op_1_lvl?: number }>
        ).find((p) => {
          const n = typeof p === 'string' ? p : String(p?.name ?? '');
          return n.toLowerCase() === chip.name.toLowerCase();
        });
        const lvl = typeof prop === 'object' && prop && prop.op_1_lvl != null ? Number(prop.op_1_lvl) : 0;
        return {
          ...chip,
          level: lvl > 1 ? lvl : undefined,
        };
      });
      const totalTP = costs.totalTP;
      return {
        id: String(item.docId ?? item.id ?? ''),
        name: String(item.name ?? ''),
        description: String(item.description ?? ''),
        type: formatListCellLabel(item.type),
        rarity: formatListCellLabel(rarity),
        currency: Math.round(currencyCost),
        tp: Math.round(totalTP),
        range: rangeStr || '-',
        damage: formatDamageDisplay(item.damage) || '-',
        parts,
        hasDrift: syncResult.hasDrift,
        syncIssues: syncResult.issues,
      };
    });
  }, [items, propertiesDb]);

  const driftedIds = useMemo(
    () => cardData.filter((item) => item.hasDrift).map((item) => item.id),
    [cardData]
  );

  const sync = useLibraryEntitySync({
    saveType: 'items',
    sources: items,
    getRowId: (i) => String(i.docId ?? i.id ?? ''),
    getRowName: (i) => String(i.name ?? ''),
    driftedIds,
    sanitize: (source) => sanitizeItemForSync(source, propertiesDb),
    refetch,
    entitySingular: ARMAMENT_LIBRARY_LABELS.entitySingular,
    entityPlural: ARMAMENT_LIBRARY_LABELS.entityPlural,
  });

  const dup = useLibraryDuplicateConfirm({
    duplicateTitle: ARMAMENT_LIBRARY_LABELS.duplicateTitle,
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
      labels={ARMAMENT_LIBRARY_LABELS}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refetch()}
      totalCount={cardData.length}
      emptyIcon={<Shield className="w-8 h-8" />}
      search={search}
      onSearchChange={setSearch}
      sortState={sortState}
      onSort={handleSort}
      headerColumns={ARMAMENT_HEADER_COLUMNS}
      gridColumns={ARMAMENT_GRID_COLUMNS}
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
      {filteredData.map((item) => (
        <GridListRow
          key={item.id}
          id={item.id}
          name={item.name}
          description={item.description}
          gridColumns={ARMAMENT_GRID_COLUMNS}
          columns={[
            { key: 'Type', value: item.type, align: 'center' },
            { key: 'Rarity', value: item.rarity, align: 'center' },
            { key: 'Currency', value: item.currency, align: 'center' },
            { key: 'TP', value: item.tp, highlight: true, align: 'center' },
            { key: 'Range', value: item.range, align: 'center' },
            { key: 'Damage', value: item.damage, align: 'center' },
          ]}
          chips={item.parts}
          chipsLabel="Properties & Proficiencies"
          totalCost={item.tp}
          costLabel="Training Points"
          badges={item.hasDrift ? [{ label: 'Needs sync', color: 'amber' }] : []}
          warningMessage={item.syncIssues[0]?.message}
          rightSlot={
            item.hasDrift ? (
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
      ))}
    </UserLibraryEntityTabShell>
  );
}
