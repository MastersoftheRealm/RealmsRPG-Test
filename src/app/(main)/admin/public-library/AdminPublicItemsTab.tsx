/**
 * Admin Official Library — Armaments (items) tab
 * List displayed like Library. Edit opens Item Creator with item loaded; row delete remains.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  SectionHeader,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  GridListRow,
  ListEmptyState,
  DeleteConfirmModal,
  type ChipData,
} from '@/components/shared';
import { useToast } from '@/components/ui';
import { useOfficialLibrary, useItemProperties } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useSort } from '@/hooks/use-sort';
import { apiFetch } from '@/lib/api-client';
import type { ItemPropertyPayload } from '@/lib/calculators/item-calc';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  formatRange,
  trainingPointsForItemPropertyRef,
} from '@/lib/calculators/item-calc';
import { formatDamageDisplay, formatListCellLabel } from '@/lib/utils';
import { Shield } from 'lucide-react';

const ITEM_GRID = '1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 40px';
const QUERY_KEY = ['official-library', 'items'] as const;

export function AdminPublicItemsTab() {
  const { showToast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, error, refetch } = useOfficialLibrary('items');
  const { data: propertiesDb = [] } = useItemProperties();
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return (items as Array<Record<string, unknown>>).map((item) => {
      const props = (Array.isArray(item.properties) ? item.properties : []) as ItemPropertyPayload[];
      const costs = calculateItemCosts(props, propertiesDb);
      const { currencyCost, rarity } = calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP);
      const rangeStr = formatRange(props);
      const damageStr = formatDamageDisplay(item.damage) || '';
      const typeStr = formatListCellLabel(item.type);
      const parts: ChipData[] = (
        (item.properties as Array<string | { id?: unknown; name?: string; op_1_lvl?: number }>) || []
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
      return {
        id: String(item.id ?? item.docId ?? ''),
        raw: item,
        name: String(item.name ?? ''),
        description: String(item.description ?? ''),
        type: typeStr,
        rarity: formatListCellLabel(rarity),
        currency: currencyCost,
        tp: costs.totalTP,
        range: rangeStr,
        damage: damageStr,
        parts,
      };
    });
  }, [items, propertiesDb]);

  const filtered = useMemo(() => {
    let r = cardData;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(
        (x) =>
          String(x.name ?? '').toLowerCase().includes(s) ||
          String(x.description ?? '').toLowerCase().includes(s) ||
          String(x.type ?? '').toLowerCase().includes(s)
      );
    }
    return sortItems(r);
  }, [cardData, search, sortItems]);

  const handleDeleteFromList = async () => {
    if (!deleteConfirm) return;
    try {
      await apiFetch(`/api/official/items?id=${encodeURIComponent(deleteConfirm.id)}`, {
        method: 'DELETE',
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      await queryClient.refetchQueries({ queryKey: QUERY_KEY });
      setDeleteConfirm(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete', 'error');
    }
  };

  if (error) return <ErrorDisplay message="Failed to load official armaments" onRetry={() => { void refetch(); }} />;

  return (
    <div>
      <SectionHeader title="Official Armaments" size="md" />
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search armaments..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'type', label: 'TYPE' },
          { key: 'rarity', label: 'RARITY' },
          { key: 'currency', label: 'CURRENCY' },
          { key: 'tp', label: 'TP' },
          { key: 'range', label: 'RANGE' },
          { key: 'damage', label: 'DAMAGE' },
          { key: '_actions', label: '', sortable: false as const },
        ]}
        gridColumns={ITEM_GRID}
        sortState={sortState}
        onSort={handleSort}
      />
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <ListEmptyState
            icon={<Shield className="w-8 h-8" />}
            title="No official armaments"
            message="Add one from the header or publish from a creator."
          />
        ) : (
          filtered.map((i) => (
            <GridListRow
              key={i.id}
              id={i.id}
              name={i.name}
              description={i.description}
              gridColumns={ITEM_GRID}
              columns={[
                { key: 'Type', value: i.type },
                { key: 'Rarity', value: i.rarity },
                { key: 'Currency', value: i.currency },
                { key: 'TP', value: i.tp },
                { key: 'Range', value: i.range },
                { key: 'Damage', value: i.damage },
              ]}
              chips={i.parts}
              chipsLabel="Properties"
              totalCost={i.tp}
              costLabel="TP"
              onEdit={() => router.push(`/item-creator?edit=${encodeURIComponent(i.id)}`)}
              onDelete={() => setDeleteConfirm({ id: i.id, name: i.name })}
            />
          ))
        )}
      </div>

      {deleteConfirm && (
        <DeleteConfirmModal
          isOpen={true}
          itemName={deleteConfirm.name}
          itemType="armament"
          deleteContext="Realms Library"
          isDeleting={false}
          onConfirm={handleDeleteFromList}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
