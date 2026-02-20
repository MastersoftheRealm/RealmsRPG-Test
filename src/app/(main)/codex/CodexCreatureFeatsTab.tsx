/**
 * Codex Creature Feats Tab (Public)
 * ==================================
 * Read-only creature feats list matching admin codex design: search, sort, GridListRow.
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
import { useCreatureFeats, type CreatureFeat } from '@/hooks';
import { useSort } from '@/hooks/use-sort';

const CREATURE_FEAT_GRID_COLUMNS = '1.5fr 0.5fr 0.5fr 0.5fr 40px';
const CREATURE_FEAT_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'points', label: 'PTS' },
  { key: 'feat_lvl', label: 'FEAT LVL' },
  { key: 'lvl_req', label: 'REQ. LVL' },
  { key: '_actions', label: '', sortable: false as const },
];

export function CodexCreatureFeatsTab() {
  const { data: creatureFeats, isLoading, error } = useCreatureFeats();
  const [search, setSearch] = useState('');
  const { sortState, handleSort, sortItems } = useSort('name');

  const filtered = useMemo(
    () =>
      sortItems<CreatureFeat>(
        (creatureFeats || []).filter(
          (f: CreatureFeat) =>
            !search ||
            f.name.toLowerCase().includes(search.toLowerCase()) ||
            f.description?.toLowerCase().includes(search.toLowerCase())
        )
      ),
    [creatureFeats, search, sortState, sortItems]
  );

  if (error) return <ErrorState message="Failed to load creature feats" />;

  return (
    <div>
      <div className="mb-4 mt-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search creature feats..." />
      </div>

      <ListHeader
        columns={CREATURE_FEAT_COLUMNS}
        gridColumns={CREATURE_FEAT_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          {filtered.length === 0 ? (
            <EmptyState
              title="No creature feats found"
              description="Try adjusting your search."
              size="sm"
            />
          ) : (
            filtered.map((f: CreatureFeat) => (
              <GridListRow
                key={f.id}
                id={f.id}
                name={f.name}
                description={f.description || ''}
                gridColumns={CREATURE_FEAT_GRID_COLUMNS}
                columns={[
                  { key: 'Pts', value: String(f.points ?? '-') },
                  { key: 'Feat Lvl', value: f.feat_lvl != null && f.feat_lvl > 0 ? String(f.feat_lvl) : '-' },
                  { key: 'Req. Lvl', value: f.lvl_req != null && f.lvl_req > 0 ? String(f.lvl_req) : '-' },
                ]}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
