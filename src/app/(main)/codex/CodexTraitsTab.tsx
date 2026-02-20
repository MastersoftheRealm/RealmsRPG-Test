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
  ListHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
} from '@/components/shared';
import { useTraits, type Trait } from '@/hooks';
import { useSort } from '@/hooks/use-sort';

const TRAIT_GRID_COLUMNS = '1.5fr 0.6fr 0.6fr 40px';
const TRAIT_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'uses_per_rec', label: 'USES' },
  { key: 'rec_period', label: 'RECOVERY' },
  { key: '_actions', label: '', sortable: false as const },
];

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

      <ListHeader
        columns={TRAIT_COLUMNS}
        gridColumns={TRAIT_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

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
