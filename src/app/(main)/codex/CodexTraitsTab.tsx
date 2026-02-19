/**
 * Codex Traits Tab (Public)
 * =========================
 * Read-only traits list matching admin codex design: search, sort, GridListRow.
 * No edit/delete.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  SearchInput,
  SortHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
} from '@/components/shared';
import { useTraits, type Trait } from '@/hooks';
import { useSort } from '@/hooks/use-sort';

const TRAIT_GRID_COLUMNS = '1.5fr 0.6fr 0.6fr 40px';

export function CodexTraitsTab() {
  const { data: traits, isLoading, error } = useTraits();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const filtered = useMemo(
    () =>
      sortItems<Trait>(
        (traits || []).filter(
          (t: Trait) =>
            !search ||
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.description?.toLowerCase().includes(search.toLowerCase())
        )
      ),
    [traits, search, sortState, sortItems]
  );

  if (error) return <ErrorState message="Failed to load traits" />;

  return (
    <div>
      <div className="mb-4 mt-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search traits..." />
      </div>

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700 dark:text-primary-300"
        style={{ gridTemplateColumns: TRAIT_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="USES" col="uses_per_rec" sortState={sortState} onSort={handleSort} />
        <SortHeader label="RECOVERY" col="rec_period" sortState={sortState} onSort={handleSort} />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {filtered.length === 0 ? (
            <EmptyState
              title="No traits found"
              description="Try adjusting your search."
              size="sm"
            />
          ) : (
            filtered.map((t: Trait) => (
              <GridListRow
                key={t.id}
                id={t.id}
                name={t.name}
                description={t.description || ''}
                gridColumns={TRAIT_GRID_COLUMNS}
                columns={[
                  { key: 'Uses', value: t.uses_per_rec != null && t.uses_per_rec > 0 ? String(t.uses_per_rec) : '-' },
                  { key: 'Recovery', value: t.rec_period || '-' },
                ]}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
