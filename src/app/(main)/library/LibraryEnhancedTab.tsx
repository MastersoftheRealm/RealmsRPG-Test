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
import { ErrorDisplay, HubListRow } from '@/components/shared';
import { useEnhancedItems } from '@/hooks';
import type { UserEnhancedItem } from '@/types/crafting';

function baseItemName(base: UserEnhancedItem['baseItem']): string {
  if ('source' in base) return base.name;
  return base.name;
}

export function LibraryEnhancedTab({
  onDelete,
}: {
  onDelete: (item: UserEnhancedItem) => void;
}) {
  const { data: items = [], isLoading, error } = useEnhancedItems();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const s = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(s) ||
        baseItemName(i.baseItem).toLowerCase().includes(s) ||
        i.powerRef.name.toLowerCase().includes(s)
    );
  }, [items, search]);

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
              : 'Complete an enhanced crafting session and choose "Save to Library" to add enhanced equipment here.'
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
          {filtered.map((item) => (
            <HubListRow
              key={item.id}
              icon={<Sparkles className="w-5 h-5" />}
              iconContainerClassName="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
              title={item.name}
              subtitle={
                `Base: ${baseItemName(item.baseItem)} · Power: ${item.powerRef.name}` +
                (item.potency != null ? ` · Potency ${item.potency}` : '') +
                (item.usesType ? ` · ${item.usesType}${item.usesCount != null ? ` ${item.usesCount}` : ''}` : '')
              }
              description={item.description ?? undefined}
              showChevron={false}
              onDelete={() => onDelete(item)}
              deleteAriaLabel={`Delete ${item.name}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
