/**
 * Codex Creature Feats Tab (Public)
 * ==================================
 * Read-only creature feats list matching admin codex design: search, sort, GridListRow.
 * No edit/delete.
 */

'use client';

import { useState, useMemo } from 'react';
import { CodexRulesSourceFilter } from '@/components/patterns/filters';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/patterns';
import { rowMatchesCodexRulesSourceFilter } from '@/lib/codex/list-rules-source-filter';
import type { CodexSourceId } from '@/lib/codex/sources';
import { formatCreatureLevel } from '@/lib/game';
import { useCreatureFeats, type CreatureFeat } from '@/hooks';
import { useSort } from '@/hooks/use-sort';
import { CodexMyCodexEmpty } from './CodexMyCodexEmpty';

const CREATURE_FEAT_GRID_COLUMNS = '1.5fr 0.5fr 0.5fr 0.5fr';
const CREATURE_FEAT_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'points', label: 'PTS' },
  { key: 'feat_lvl', label: 'FEAT LVL' },
  { key: 'lvl_req', label: 'REQ. LVL' },
];

export function CodexCreatureFeatsTab({
  codexMode = 'public',
}: {
  codexMode?: 'public' | 'my' | undefined;
}) {
  const loadPublicCodex = codexMode === 'public';
  const {
    data: creatureFeats,
    isLoading,
    error,
    refetch,
  } = useCreatureFeats({ enabled: loadPublicCodex });
  const [search, setSearch] = useState('');
  const [rulesSources, setRulesSources] = useState<CodexSourceId[]>([]);
  const { sortState, handleSort, sortItems } = useSort('name');

  const filtered = useMemo(
    () =>
      sortItems<CreatureFeat>(
        (creatureFeats || []).filter((f: CreatureFeat) => {
          if (
            search &&
            !f.name.toLowerCase().includes(search.toLowerCase()) &&
            !f.description?.toLowerCase().includes(search.toLowerCase())
          ) {
            return false;
          }
          return rowMatchesCodexRulesSourceFilter(f.sources, rulesSources);
        }),
      ),
    [creatureFeats, search, rulesSources, sortItems],
  );

  if (codexMode === 'my') {
    return <CodexMyCodexEmpty />;
  }

  if (error)
    return <ErrorState message="Failed to load creature feats" onRetry={() => refetch()} />;

  return (
    <CodexBrowseListShell
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search creature feats..."
      searchAriaLabel="Search creature feats"
      filters={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CodexRulesSourceFilter
            selectedValues={rulesSources}
            onSelect={(id) => setRulesSources((prev) => (prev.includes(id) ? prev : [...prev, id]))}
            onRemove={(id) => setRulesSources((prev) => prev.filter((s) => s !== id))}
          />
        </div>
      }
      headerColumns={CREATURE_FEAT_COLUMNS}
      gridColumns={CREATURE_FEAT_GRID_COLUMNS}
      sortState={sortState}
      onSort={handleSort}
      isLoading={isLoading}
      isEmpty={filtered.length === 0}
      emptyTitle="No creature feats found"
      emptyMessage="Try adjusting your search."
    >
      {filtered.map((f: CreatureFeat) => (
        <GridListRow
          key={f.id}
          id={f.id}
          name={f.name}
          description={f.description || ''}
          gridColumns={CREATURE_FEAT_GRID_COLUMNS}
          columns={[
            { key: 'Pts', value: String(f.points ?? '-') },
            { key: 'Feat Lvl', value: f.feat_lvl != null ? String(f.feat_lvl) : '-' },
            { key: 'Req. Lvl', value: f.lvl_req != null ? formatCreatureLevel(f.lvl_req) : '-' },
          ]}
        />
      ))}
    </CodexBrowseListShell>
  );
}
