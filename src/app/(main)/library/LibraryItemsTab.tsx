/**
 * Library Items (Armaments) Tab
 * =============================
 * User's armaments list with search and sort.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Shield } from 'lucide-react';
import {
  GridListRow,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
  type ChipData,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import type { ItemPropertyPayload } from '@/lib/calculators/item-calc';
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  formatRange as formatItemRange,
} from '@/lib/calculators/item-calc';
import { formatDamageDisplay, formatListCellLabel } from '@/lib/utils';
import { useUserItems, useItemProperties, useDuplicateItem } from '@/hooks';
import { Button, useToast } from '@/components/ui';
import type { DisplayItem } from '@/types';

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
  const { data: items = [], isLoading, error } = useUserItems();
  const { data: propertiesDb = [] } = useItemProperties();
  const duplicateItem = useDuplicateItem();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return (items || []).map(item => {
      const props = (Array.isArray(item.properties) ? item.properties : []) as ItemPropertyPayload[];
      const costs = calculateItemCosts(props, propertiesDb);
      const { currencyCost, rarity } = calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP);
      const rangeStr = formatItemRange(props);
      const parts: ChipData[] = ((item.properties || []) as Array<{ id?: unknown; name?: string; op_1_lvl?: number }>).map((prop) => {
        const dbProp = propertiesDb.find((p: { name?: string }) => p.name?.toLowerCase() === (prop.name || '').toLowerCase());
        const baseTp = dbProp?.base_tp ?? dbProp?.tp_cost ?? 0;
        const optLevel = prop.op_1_lvl ?? 1;
        return {
          name: dbProp?.name || prop.name || '',
          description: dbProp?.description || '',
          cost: baseTp * optLevel,
          costLabel: 'TP',
          level: optLevel > 1 ? optLevel : undefined,
        };
      });
      const totalTP = parts.reduce((sum, p) => sum + (p.cost || 0), 0);
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
      };
    });
  }, [items, propertiesDb]);

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
    return <ErrorDisplay message="Failed to load armaments" subMessage="Please try again later" />;
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
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search armaments..."
        />
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
              onEdit={() => router.push(`/item-creator?edit=${item.id}`)}
              onDelete={() => onDelete({ id: item.id, name: item.name } as DisplayItem)}
              onDuplicate={() => duplicateItem.mutate(item.id, { onError: (e) => showToast(e?.message ?? 'Failed to duplicate', 'error') })}
            />
          ))
        )}
      </div>
    </div>
  );
}
