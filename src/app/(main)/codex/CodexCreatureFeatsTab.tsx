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
  SortHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
  ListEmptyState as EmptyState,
} from '@/components/shared';
import { useCreatureFeats, type CreatureFeat } from '@/hooks';
import { useSort } from '@/hooks/use-sort';

const CREATURE_FEAT_GRID_COLUMNS = '1.5fr 0.5fr 0.5fr 0.5fr 40px';

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

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700 dark:text-primary-300"
        style={{ gridTemplateColumns: CREATURE_FEAT_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="PTS" col="points" sortState={sortState} onSort={handleSort} />
        <SortHeader label="FEAT LVL" col="feat_lvl" sortState={sortState} onSort={handleSort} />
        <SortHeader label="REQ. LVL" col="lvl_req" sortState={sortState} onSort={handleSort} />
      </div>

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
