/**
 * Admin Public Library — Armaments (items) tab
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
import { usePublicLibrary, useItemProperties } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useSort } from '@/hooks/use-sort';
import type { ItemPropertyPayload, ItemDamage } from '@/lib/calculators/item-calc';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  formatRange,
  formatDamage,
} from '@/lib/calculators/item-calc';
import { Shield } from 'lucide-react';

const ITEM_GRID = '1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 40px';
const QUERY_KEY = ['public-library', 'items'] as const;

const TYPE_MAP: Record<string, string> = {
  weapon: 'Weapon',
  armor: 'Armor',
  shield: 'Shield',
  equipment: 'Equipment',
};

export function AdminPublicItemsTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, error } = usePublicLibrary('items');
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
      const damageArr = item.damage;
      const damageStr = Array.isArray(damageArr) && damageArr[0]
        ? formatDamage(damageArr as ItemDamage[])
        : '';
      const typeStr = TYPE_MAP[String(item.type ?? '').toLowerCase()] || String(item.type ?? '');
      const parts: ChipData[] = ((item.properties as Array<{ id?: unknown; name?: string; op_1_lvl?: number }>) || []).map((prop) => ({
        name: prop.name || '',
        cost: prop.op_1_lvl ?? 1,
        costLabel: 'Lvl',
      }));
      return {
        id: String(item.id ?? item.docId ?? ''),
        raw: item,
        name: String(item.name ?? ''),
        description: String(item.description ?? ''),
        type: typeStr,
        rarity,
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
      const res = await fetch(`/api/public/items?id=${encodeURIComponent(deleteConfirm.id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(res.statusText);
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleteConfirm(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  if (error) return <ErrorDisplay message="Failed to load public armaments" />;

  return (
    <div>
      <SectionHeader title="Public Armaments" size="md" />
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search armaments..." />
      </div>
      <ListHeader
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'type', label: 'TYPE', sortable: false as const },
          { key: 'rarity', label: 'RARITY', sortable: false as const },
          { key: 'currency', label: 'CURRENCY', sortable: false as const },
          { key: 'tp', label: 'TP', sortable: false as const },
          { key: 'range', label: 'RANGE', sortable: false as const },
          { key: 'damage', label: 'DAMAGE', sortable: false as const },
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
            title="No public armaments"
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
          deleteContext="public library"
          isDeleting={false}
          onConfirm={handleDeleteFromList}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
