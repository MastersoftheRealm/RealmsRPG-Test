/**
 * Library Items (Armaments) Tab
 * =============================
 * User's armaments list with search and sort.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, Shield } from 'lucide-react';
import {
  GridListRow,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
  ConfirmActionModal,
  type ChipData,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import type { ItemPropertyPayload } from '@/lib/calculators/item-calc';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  formatRange as formatItemRange,
  trainingPointsForItemPropertyRef,
} from '@/lib/calculators/item-calc';
import { formatDamageDisplay, formatListCellLabel } from '@/lib/utils';
import { useUserItems, useItemProperties, useDuplicateItem } from '@/hooks';
import { Button, IconButton, useToast } from '@/components/ui';
import type { DisplayItem } from '@/types';
import { getItemSyncResult, sanitizeItemForSync } from '@/lib/library-sync';
import { saveToLibrary } from '@/services/library-service';

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
  const { showToast } = useToast();
  const { data: items = [], isLoading, error, refetch } = useUserItems();
  const { data: propertiesDb = [] } = useItemProperties();
  const duplicateItem = useDuplicateItem();
  const [search, setSearch] = useState('');
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncingAll, setSyncingAll] = useState(false);
  const [duplicateConfirm, setDuplicateConfirm] = useState<{ id: string; name: string } | null>(null);
  const [showSyncAllConfirm, setShowSyncAllConfirm] = useState(false);
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return (items || []).map(item => {
      const props = (Array.isArray(item.properties) ? item.properties : []) as ItemPropertyPayload[];
      const costs = calculateItemCosts(props, propertiesDb);
      const syncResult = getItemSyncResult(item, propertiesDb);
      const { currencyCost, rarity } = calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP);
      const rangeStr = formatItemRange(props);
      const parts: ChipData[] = (
        (item.properties || []) as Array<string | { id?: unknown; name?: string; op_1_lvl?: number }>
      ).map((prop) => {
        const propName = typeof prop === 'string' ? prop : (prop.name || '');
        const dbProp = propertiesDb.find(
          (p: { name?: string }) => p.name?.toLowerCase() === String(propName).toLowerCase()
        );
        const cost = trainingPointsForItemPropertyRef(prop, propertiesDb);
        const lvl = typeof prop === 'object' && prop && prop.op_1_lvl != null ? prop.op_1_lvl : 0;
        return {
          name: dbProp?.name || propName || '',
          description: dbProp?.description || '',
          cost: cost > 0 ? cost : undefined,
          costLabel: 'TP',
          category: (cost > 0 ? 'cost' : 'default') as 'cost' | 'default',
          level: lvl > 1 ? lvl : undefined,
        };
      });
      const totalTP = parts.reduce((sum, p) => sum + (p.cost || 0), 0);
      return {
        id: String(item.docId ?? item.id ?? ''),
        source: item,
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

  const driftedItems = useMemo(() => cardData.filter((item) => item.hasDrift), [cardData]);

  const handleSyncOne = async (itemId: string) => {
    const source = items.find((i) => String(i.docId ?? i.id ?? '') === itemId);
    if (!source) return;
    const sanitized = sanitizeItemForSync(source, propertiesDb);
    if (!sanitized.hasDrift || !sanitized.changed) return;

    setSyncingIds((prev) => new Set(prev).add(itemId));
    try {
      await saveToLibrary('items', sanitized.value as unknown as Record<string, unknown>, { existingId: itemId });
      await refetch();
      showToast(`Synced "${source.name}" to current patch rules.`, 'success');
    } catch (e) {
      showToast((e as Error)?.message ?? 'Failed to sync armament', 'error');
    } finally {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleSyncAll = async () => {
    if (driftedItems.length === 0) return;
    setSyncingAll(true);
    let syncedCount = 0;
    try {
      for (const item of driftedItems) {
        const source = items.find((i) => String(i.docId ?? i.id ?? '') === item.id);
        if (!source) continue;
        const sanitized = sanitizeItemForSync(source, propertiesDb);
        if (!sanitized.hasDrift || !sanitized.changed) continue;
        await saveToLibrary('items', sanitized.value as unknown as Record<string, unknown>, { existingId: item.id });
        syncedCount += 1;
      }
      await refetch();
      showToast(
        syncedCount > 0
          ? `Synced ${syncedCount} armament${syncedCount === 1 ? '' : 's'} with current patch.`
          : 'All armaments are already in sync.',
        'success'
      );
    } catch (e) {
      showToast((e as Error)?.message ?? 'Failed to sync all armaments', 'error');
    } finally {
      setSyncingAll(false);
    }
  };

  const filteredData = useMemo(() => {
    let result = cardData;
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(item =>
        String(item.name ?? '').toLowerCase().includes(searchLower) ||
        String(item.description ?? '').toLowerCase().includes(searchLower) ||
        item.parts.some(p => String(p.name ?? '').toLowerCase().includes(searchLower))
      );
    }
    return sortItems(result);
  }, [cardData, search, sortItems]);

  if (error) {
    return <ErrorDisplay message="Failed to load armaments" subMessage="Please try again later" onRetry={() => refetch()} />;
  }

  if (!isLoading && cardData.length === 0) {
    return (
      <ListEmptyState
        icon={<Shield className="w-8 h-8" />}
        title="No armaments yet"
        message="Create your first weapon, armor, or equipment to see it here."
        action={
          <Button asChild>
            <Link href="/item-creator">
              <Plus className="w-4 h-4" />
              Create Armament
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search armaments..."
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowSyncAllConfirm(true)}
          disabled={driftedItems.length === 0 || syncingAll}
        >
          <RefreshCw className={`w-4 h-4 ${syncingAll ? 'animate-spin' : ''}`} />
          Sync with current patch
          {driftedItems.length > 0 ? ` (${driftedItems.length})` : ''}
        </Button>
      </div>

      <ListHeader
        columns={ARMAMENT_HEADER_COLUMNS}
        gridColumns={ARMAMENT_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredData.length === 0 ? (
          <div className="py-12 text-center text-text-secondary">No armaments match your search.</div>
        ) : (
          filteredData.map(item => (
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
              costLabel="TP"
              badges={item.hasDrift ? [{ label: 'Needs sync', color: 'amber' }] : []}
              warningMessage={item.syncIssues[0]?.message}
              rightSlot={item.hasDrift ? (
                <IconButton
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleSyncOne(item.id);
                  }}
                  label="Sync with current patch"
                  className="text-warning-700 hover:text-warning-700 dark:text-warning-400"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingIds.has(item.id) ? 'animate-spin' : ''}`} />
                </IconButton>
              ) : undefined}
              onEdit={() => router.push(`/item-creator?edit=${item.id}`)}
              onDelete={() => onDelete({ id: item.id, name: item.name } as DisplayItem)}
              onDuplicate={() => setDuplicateConfirm({ id: item.id, name: item.name })}
            />
          ))
        )}
      </div>

      <ConfirmActionModal
        isOpen={!!duplicateConfirm}
        onClose={() => setDuplicateConfirm(null)}
        onConfirm={() => {
          if (!duplicateConfirm) return;
          duplicateItem.mutate(duplicateConfirm.id, {
            onSuccess: () => {
              showToast(`Duplicated "${duplicateConfirm.name}"`, 'success');
              setDuplicateConfirm(null);
            },
            onError: (e) => showToast(e?.message ?? 'Failed to duplicate', 'error'),
          });
        }}
        title="Duplicate armament?"
        description={
          duplicateConfirm
            ? `Create a copy of "${duplicateConfirm.name}" in your library?`
            : ''
        }
        confirmLabel="Duplicate"
        loadingLabel="Duplicating..."
        isLoading={duplicateItem.isPending}
      />

      <ConfirmActionModal
        isOpen={showSyncAllConfirm}
        onClose={() => setShowSyncAllConfirm(false)}
        onConfirm={() => {
          setShowSyncAllConfirm(false);
          void handleSyncAll();
        }}
        title="Sync with current patch?"
        description={`Sync ${driftedItems.length} armament${driftedItems.length === 1 ? '' : 's'} to current patch rules. Properties that no longer exist in the codex may be removed.`}
        confirmLabel="Sync all"
        loadingLabel="Syncing..."
        isLoading={syncingAll}
      />
    </div>
  );
}
