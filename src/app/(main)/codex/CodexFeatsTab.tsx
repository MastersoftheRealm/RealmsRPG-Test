/**
 * Codex Feats Tab
 * ===============
 * Feat list with filters: level, ability req, categories, tags, feat type, state feats.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  ChipSelect,
  AbilityRequirementFilter,
  TagFilter,
  SelectFilter,
  FilterSection,
  CodexFeatRow,
} from '@/components/codex';
import {
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import { CodexMyCodexEmpty } from './CodexMyCodexEmpty';
import { Input } from '@/components/ui';
import { useCodexFeats, useCodexSkills, useCharacter, type Feat, type Skill } from '@/hooks';
import { cn } from '@/lib/utils';
import { groupFeatFamilies } from '@/lib/leveled-feats';
import {
  CODEX_FEAT_HEADER_COLUMNS,
  FEAT_GRID_COLUMNS,
  buildFeatFilterOptions,
  buildSkillIdToName,
  filterFeats,
  type FeatListFilters,
} from '@/lib/codex/feat-list';
import type { CodexSkillForFeat } from '@/lib/game/formulas';

interface FeatFilters extends FeatListFilters {
  featTypeMode: 'all' | 'archetype' | 'character';
  stateFeatMode: 'all' | 'only' | 'hide';
}

export function CodexFeatsTab({
  codexMode = 'public',
  characterId = '',
}: {
  codexMode?: 'public' | 'my';
  /** When set, auto-filter feats to those the given character qualifies for. */
  characterId?: string;
}) {
  const loadPublicCodex = codexMode === 'public';
  const { data: feats, isLoading, error, refetch } = useCodexFeats({ enabled: loadPublicCodex });
  const { data: skills = [] } = useCodexSkills({ enabled: loadPublicCodex });
  const { data: characterResult } = useCharacter(loadPublicCodex ? characterId || undefined : undefined);
  const character = characterResult?.character ?? undefined;
  const { sortState, handleSort, sortItems } = useSort('name');

  // When a character is selected, hide feats they don't qualify for by default.
  const [showUnqualified, setShowUnqualified] = useState(false);

  const [filters, setFilters] = useState<FeatFilters>({
    search: '',
    maxLevel: null,
    abilityRequirements: [],
    categories: [],
    abilities: [],
    tags: [],
    tagMode: 'all',
    featTypeMode: 'all',
    stateFeatMode: 'all',
  });

  const activeCharacter = characterId ? character : undefined;

  const filterOptions = useMemo(() => buildFeatFilterOptions(feats), [feats]);

  const skillIdToName = useMemo(() => buildSkillIdToName(skills as Skill[]), [skills]);

  const filteredFeats = useMemo(() => {
    if (!feats) return [];
    const filtered = filterFeats(feats, filters, {
      character: activeCharacter,
      showUnqualified,
      skills: skills as CodexSkillForFeat[],
      allFeats: feats,
    });
    return sortItems<Feat>(filtered);
  }, [feats, filters, sortItems, activeCharacter, showUnqualified, skills]);

  const featFamilies = useMemo(() => groupFeatFamilies(filteredFeats), [filteredFeats]);

  if (codexMode === 'my') {
    return <CodexMyCodexEmpty />;
  }

  if (error) {
    return <ErrorState message="Failed to load feats" onRetry={() => refetch()} />;
  }

  return (
    <div>
      <h2 className="sr-only">Feats</h2>
      <div className="mb-4">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Search names, tags, descriptions..."
        />
      </div>

      {characterId && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 px-4 py-3">
          <p className="text-sm text-text-secondary">
            Showing feats{' '}
            <span className="font-semibold text-text-primary">
              {activeCharacter?.name ?? 'this character'}
            </span>{' '}
            {showUnqualified ? 'can take, including those not yet qualified for' : 'qualifies for'} —
            filtered by level, abilities, skills, and speed.
          </p>
          <button
            type="button"
            onClick={() => setShowUnqualified((v) => !v)}
            aria-pressed={showUnqualified}
            className={cn(
              'px-3 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[44px] flex-shrink-0',
              showUnqualified
                ? 'bg-surface border-border-light text-text-secondary hover:bg-surface-alt'
                : 'bg-success-50 dark:bg-success-900/30 border-success-300 dark:border-success-600/50 text-success-700 dark:text-success-300'
            )}
          >
            {showUnqualified ? 'Hide unqualified feats' : 'Show unqualified feats'}
          </button>
        </div>
      )}

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="filter-group">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Max Required Level
            </label>
            <Input
              type="number"
              min={0}
              value={filters.maxLevel ?? ''}
              onChange={(e) => setFilters(f => ({
                ...f,
                maxLevel: e.target.value ? parseInt(e.target.value) : null
              }))}
              placeholder="No limit"
            />
            <p className="text-xs text-text-muted dark:text-text-secondary mt-1">Hide feats requiring higher levels</p>
          </div>

          <div className="md:col-span-2">
            <AbilityRequirementFilter
              label="Ability/Defense Requirement"
              abilities={filterOptions.abilReqAbilities}
              requirements={filters.abilityRequirements}
              onAdd={(req) => setFilters(f => ({ ...f, abilityRequirements: [...f.abilityRequirements, req] }))}
              onRemove={(ability) => setFilters(f => ({
                ...f,
                abilityRequirements: f.abilityRequirements.filter(r => r.ability !== ability)
              }))}
            />
          </div>

          <ChipSelect
            label="Category"
            placeholder="Choose category"
            options={filterOptions.categories.map(c => ({ value: c, label: c }))}
            selectedValues={filters.categories}
            onSelect={(v) => setFilters(f => ({ ...f, categories: [...f.categories, v] }))}
            onRemove={(v) => setFilters(f => ({ ...f, categories: f.categories.filter(c => c !== v) }))}
          />

          <ChipSelect
            label="Ability"
            placeholder="Choose ability"
            options={filterOptions.abilities.map(a => ({ value: a, label: a }))}
            selectedValues={filters.abilities}
            onSelect={(v) => setFilters(f => ({ ...f, abilities: [...f.abilities, v] }))}
            onRemove={(v) => setFilters(f => ({ ...f, abilities: f.abilities.filter(a => a !== v) }))}
          />

          <div className="md:col-span-2">
            <TagFilter
              tags={filterOptions.tags}
              selectedTags={filters.tags}
              tagMode={filters.tagMode}
              onSelect={(t) => setFilters(f => ({ ...f, tags: [...f.tags, t] }))}
              onRemove={(t) => setFilters(f => ({ ...f, tags: f.tags.filter(tag => tag !== t) }))}
              onModeChange={(mode) => setFilters(f => ({ ...f, tagMode: mode }))}
            />
          </div>

          <SelectFilter
            label="Feat Type"
            value={filters.featTypeMode}
            options={[
              { value: 'all', label: 'All' },
              { value: 'archetype', label: 'Archetype' },
              { value: 'character', label: 'Character' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, featTypeMode: v as 'all' | 'archetype' | 'character' }))}
            placeholder={null}
          />

          <SelectFilter
            label="State Feats"
            value={filters.stateFeatMode}
            options={[
              { value: 'all', label: 'All Feats' },
              { value: 'only', label: 'Only State Feats' },
              { value: 'hide', label: 'Hide State Feats' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, stateFeatMode: v as 'all' | 'only' | 'hide' }))}
            placeholder={null}
          />
        </div>
      </FilterSection>

      <ListHeader
        columns={CODEX_FEAT_HEADER_COLUMNS}
        gridColumns={FEAT_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : featFamilies.length === 0 ? (
          <div className="p-8 text-center text-text-muted dark:text-text-secondary">No feats match your filters.</div>
        ) : (
          featFamilies.map(({ main, levels }) => (
            <CodexFeatRow
              key={main.id}
              feat={main}
              skillIdToName={skillIdToName}
              familyLevels={levels}
            />
          ))
        )}
      </div>
    </div>
  );
}
