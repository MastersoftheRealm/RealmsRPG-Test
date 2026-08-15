/**
 * Library Enhanced (Equipment) Tab
 * ================================
 * User's enhanced items (base item + power) saved from crafting.
 * List chrome via UserLibraryEntityTabShell basic mode (ADR-0001 / TASK-475).
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { GridListRow } from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import { useEnhancedItems } from '@/hooks';
import type { UserEnhancedItem } from '@/types/crafting';
import { UserLibraryEntityTabShell } from './components/UserLibraryEntityTabShell';
import { ENHANCED_LIBRARY_LABELS } from './components/library-entity-tab.types';

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
/** Match other My Library tabs — ListHeader must reserve edit/delete tracks. */
const ENHANCED_ROW_CHROME = { edit: true, delete: true } as const;
const HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'base', label: 'BASE ITEM' },
  { key: 'power', label: 'POWER' },
  { key: 'rarity', label: 'RARITY', align: 'center' as const },
  { key: 'cost', label: 'COST (C)', align: 'right' as const },
  { key: 'uses', label: 'USES', align: 'right' as const },
];

export function LibraryEnhancedTab({ onDelete }: { onDelete: (item: UserEnhancedItem) => void }) {
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
          row.power.toLowerCase().includes(s),
      );
    }

    return sortItems(result);
  }, [cardData, search, sortItems]);

  return (
    <UserLibraryEntityTabShell
      enableSync={false}
      labels={ENHANCED_LIBRARY_LABELS}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refetch()}
      totalCount={cardData.length}
      emptyIcon={<Sparkles className="h-8 w-8" />}
      search={search}
      onSearchChange={setSearch}
      sortState={sortState}
      onSort={handleSort}
      headerColumns={HEADER_COLUMNS}
      gridColumns={GRID_COLUMNS}
      rowChrome={ENHANCED_ROW_CHROME}
      filteredCount={filteredData.length}
    >
      {filteredData.map((row) => {
        const item = row.source;
        return (
          <GridListRow
            key={row.id}
            id={row.id}
            name={row.name}
            description={row.description}
            gridColumns={GRID_COLUMNS}
            rowChrome={ENHANCED_ROW_CHROME}
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
    </UserLibraryEntityTabShell>
  );
}
