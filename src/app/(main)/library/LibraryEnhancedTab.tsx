/**
 * Library Enhanced (Equipment) Tab
 * ================================
 * User's enhanced items (base item + power) saved from crafting.
 * Uses shared ErrorDisplay, HubListRow, EmptyState, and SearchInput for consistency with other library tabs.
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { SearchInput, LoadingState, EmptyState, Button } from '@/components/ui';
import { ErrorDisplay } from '@/components/shared';
import { GridListRow } from '@/components/shared/grid-list-row';
import { ListHeader, type SortState } from '@/components/shared/list-header';
import { useEnhancedItems } from '@/hooks';
import type { UserEnhancedItem } from '@/types/crafting';

function baseItemName(base: UserEnhancedItem['baseItem']): string {
  return base.name;
}

function formatUses(item: UserEnhancedItem): string {
  if (!item.usesType) return '—';
  if (item.usesType === 'permanent') return 'Permanent';
  const count = item.usesCount ?? 1;
  const label = item.usesType === 'full' ? 'Full' : 'Partial';
  return `${count} / ${label}`;
}

const GRID_COLUMNS = '2fr 1.5fr 1.5fr 0.9fr 0.9fr 0.9fr';

export function LibraryEnhancedTab({
  onDelete,
}: {
  onDelete: (item: UserEnhancedItem) => void;
}) {
  const { data: items = [], isLoading, error } = useEnhancedItems();
  const [search, setSearch] = useState('');
  const [sortState, setSortState] = useState<SortState>({ col: 'name', dir: 1 });

  const filtered = useMemo(() => {
    let list = [...items];
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          baseItemName(i.baseItem).toLowerCase().includes(s) ||
          i.powerRef.name.toLowerCase().includes(s)
      );
    }
    list.sort((a, b) => {
      const dir = sortState.dir;
      switch (sortState.col) {
        case 'base':
          return dir * baseItemName(a.baseItem).localeCompare(baseItemName(b.baseItem));
        case 'power':
          return dir * a.powerRef.name.localeCompare(b.powerRef.name);
        case 'rarity':
          return dir * (a.rarity ?? '').localeCompare(b.rarity ?? '');
        case 'cost': {
          const ac = a.currencyCost ?? 0;
          const bc = b.currencyCost ?? 0;
          return dir * (ac - bc);
        }
        default:
          return dir * a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [items, search, sortState]);

  const handleSort = (columnKey: string) => {
    setSortState((prev) => {
      if (prev.col === columnKey) {
        return { col: columnKey, dir: prev.dir === 1 ? -1 : 1 };
      }
      return { col: columnKey, dir: 1 };
    });
  };

  if (isLoading) {
    return <LoadingState message="Loading enhanced items..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message="Failed to load enhanced items"
        subMessage={error.message}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, base item, or power..."
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-10 h-10" />}
          title={search ? 'No enhanced items match your search' : 'No enhanced items yet'}
          description={
            search
              ? 'Try a different search.'
              : 'Complete an enhanced crafting session and choose \"Save to Library\" to add enhanced equipment here.'
          }
          action={
            !search ? (
              <Link href="/crafting">
                <Button>Go to Crafting</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          <ListHeader
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'base', label: 'Base Item' },
              { key: 'power', label: 'Power' },
              { key: 'rarity', label: 'Rarity', align: 'center' },
              { key: 'cost', label: 'Cost (C)', align: 'right' },
              { key: 'uses', label: 'Uses', sortable: false, align: 'right' },
            ]}
            gridColumns={GRID_COLUMNS}
            sortState={sortState}
            onSort={handleSort}
          />
          {filtered.map((item) => (
            <GridListRow
              key={item.id}
              id={item.id}
              name={item.name}
              description={item.description}
              gridColumns={GRID_COLUMNS}
              columns={[
                {
                  key: 'base',
                  value: baseItemName(item.baseItem),
                },
                {
                  key: 'power',
                  value: item.powerRef.name,
                },
                {
                  key: 'rarity',
                  value: item.rarity ?? '—',
                  align: 'center',
                },
                {
                  key: 'cost',
                  value: item.currencyCost != null ? item.currencyCost.toLocaleString() : '—',
                  align: 'right',
                },
                {
                  key: 'uses',
                  value: formatUses(item),
                  align: 'right',
                },
              ]}
              badges={[
                {
                  label: 'Enhanced',
                  color: 'purple',
                },
              ]}
              expandedContent={
                <div className="space-y-2 text-sm text-text-secondary">
                  <div>
                    <span className="font-semibold text-text-primary">Base item:</span>{' '}
                    {baseItemName(item.baseItem)}
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary">Power:</span>{' '}
                    {item.powerRef.name}
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary">Uses:</span>{' '}
                    {formatUses(item)}
                  </div>
                  {item.potency != null && (
                    <div>
                      <span className="font-semibold text-text-primary">Potency:</span>{' '}
                      {item.potency}
                    </div>
                  )}
                </div>
              }
              onDelete={() => onDelete(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
