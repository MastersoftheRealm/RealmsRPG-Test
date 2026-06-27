/**
 * Library Enhanced (Equipment) Tab
 * ================================
 * User's enhanced items (base item + power) saved from crafting.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Sparkles } from 'lucide-react';
import {
  GridListRow,
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay,
  ListEmptyState,
} from '@/components/shared';
import { Button } from '@/components/ui';
import { useSort } from '@/hooks/use-sort';
import { useEnhancedItems } from '@/hooks';
import type { UserEnhancedItem } from '@/types/crafting';

function baseItemName(base: UserEnhancedItem['baseItem']): string {
  return base.name;
}

function formatUses(item: UserEnhancedItem): string {
  if (!item.usesType) return '-';
  if (item.usesType === 'permanent') return 'Permanent';
  const count = item.usesCount ?? 1;
  const label = item.usesType === 'full' ? 'Full' : 'Partial';
  return `${count} / ${label}`;
}

const GRID_COLUMNS = '2fr 1.5fr 1.5fr 0.9fr 0.9fr 0.9fr';
const HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'base', label: 'BASE ITEM' },
  { key: 'power', label: 'POWER' },
  { key: 'rarity', label: 'RARITY', align: 'center' as const },
  { key: 'cost', label: 'COST (C)', align: 'right' as const },
  { key: 'uses', label: 'USES', sortable: false as const, align: 'right' as const },
];

export function LibraryEnhancedTab({
  onDelete,
}: {
  onDelete: (item: UserEnhancedItem) => void;
}) {
  const router = useRouter();
  const { data: items = [], isLoading, error, refetch } = useEnhancedItems();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const cardData = useMemo(() => {
    return items.map((item) => ({
      id: item.id,
      source: item,
      name: item.name,
      base: baseItemName(item.baseItem),
      power: item.powerRef.name,
      rarity: item.rarity ?? '',
      cost: item.currencyCost ?? 0,
      uses: formatUses(item),
      description: item.description,
    }));
  }, [items]);

  const filteredData = useMemo(() => {
    let result = cardData;

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (row) =>
          row.name.toLowerCase().includes(s) ||
          row.base.toLowerCase().includes(s) ||
          row.power.toLowerCase().includes(s)
      );
    }

    return sortItems(result);
  }, [cardData, search, sortItems]);

  if (isLoading) {
    return <LoadingState message="Loading enhanced items..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message="Failed to load enhanced items"
        subMessage={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  if (cardData.length === 0) {
    return (
      <ListEmptyState
        icon={<Sparkles className="w-8 h-8" />}
        title="No enhanced items yet"
        message='Complete an enhanced crafting session and choose "Save to Library" to add enhanced equipment here.'
        action={
          <Button asChild>
            <Link href="/crafting">
              <Plus className="w-4 h-4" />
              Go to Crafting
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by name, base item, or power..."
      />

      <ListHeader
        columns={HEADER_COLUMNS}
        gridColumns={GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      {filteredData.length === 0 ? (
        <ListEmptyState title="No enhanced items match your search." size="sm" />
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {filteredData.map((row) => {
            const item = row.source;
            return (
              <GridListRow
                key={row.id}
                id={row.id}
                name={row.name}
                description={row.description}
                gridColumns={GRID_COLUMNS}
                columns={[
                  { key: 'base', value: row.base },
                  { key: 'power', value: row.power },
                  { key: 'rarity', value: row.rarity || '-', align: 'center' },
                  {
                    key: 'cost',
                    value: item.currencyCost != null ? item.currencyCost.toLocaleString() : '-',
                    align: 'right',
                  },
                  { key: 'uses', value: row.uses, align: 'right' },
                ]}
                badges={[{ label: 'Enhanced', color: 'purple' }]}
                expandedContent={
                  <div className="space-y-2 text-sm text-text-secondary">
                    <div>
                      <span className="font-semibold text-text-primary">Base item:</span> {row.base}
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary">Power:</span> {row.power}
                    </div>
                    <div>
                      <span className="font-semibold text-text-primary">Uses:</span> {row.uses}
                    </div>
                    {item.potency != null && (
                      <div>
                        <span className="font-semibold text-text-primary">Potency:</span> {item.potency}
                      </div>
                    )}
                  </div>
                }
                onEdit={() => router.push(`/crafting/${encodeURIComponent(item.id)}`)}
                onDelete={() => onDelete(item)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
