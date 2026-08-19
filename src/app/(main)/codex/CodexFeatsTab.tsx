/**
 * Codex Feats Tab
 * ===============
 * Feat list with filters: level, ability req, categories, tags, feat type, state feats.
 */

'use client';

import { useState, useMemo, useCallback, useId } from 'react';
import {
  ArchetypePathFilter,
  ChipSelect,
  AbilityRequirementFilter,
  TagFilter,
  SelectFilter,
  CharacterFilter,
  FilterInput,
  FILTER_LABEL_ROW_CLASS,
} from '@/components/patterns/filters';
import { CodexFeatRow } from '@/components/codex';
import { CodexBrowseListShell, ErrorDisplay as ErrorState, InfoTippy } from '@/components/patterns';
import { useSort } from '@/hooks/use-sort';
import { CodexMyCodexEmpty } from './CodexMyCodexEmpty';
import { Button } from '@/components/ui';
import {
  useCodexFeats,
  useCodexSkills,
  useCharacter,
  usePathListFilter,
  type Feat,
  type Skill,
} from '@/hooks';
import { cn } from '@/lib/utils';
import { groupFeatFamilies } from '@/lib/leveled-feats';
import {
  CODEX_FEAT_HEADER_COLUMNS,
  FEAT_GRID_COLUMNS,
  buildFeatFilterOptions,
  featPathChipNames,
  filterFeats,
  type FeatListFilters,
} from '@/lib/codex/feat-list';
import { pathFilterEmptyTitle } from '@/lib/game/path-recommendation-index';
import { STATE_FEAT_RESTRICTION_NOTICE } from '@/lib/codex/feat-restriction-notice';
import { buildSkillIdToName } from '@/lib/codex/skill-list';
import type { CodexSkillForFeat } from '@/lib/game/formulas';
import {
  readInitialLibraryCharacterFilterId,
  writePersistedLibraryCharacterFilterId,
} from '@/lib/library/character-filter-persistence';

const SET_BY_CHARACTER_HINT = 'Set by character';

interface FeatFilters extends FeatListFilters {
  featTypeMode: 'all' | 'archetype' | 'character';
  stateFeatMode: 'all' | 'only' | 'hide';
}

export function CodexFeatsTab({
  codexMode = 'public',
}: {
  codexMode?: 'public' | 'my' | undefined;
}) {
  const loadPublicCodex = codexMode === 'public';
  const { data: feats, isLoading, error, refetch } = useCodexFeats({ enabled: loadPublicCodex });
  const { data: skills = [] } = useCodexSkills({ enabled: loadPublicCodex });

  const [characterFilterId, setCharacterFilterId] = useState(() =>
    readInitialLibraryCharacterFilterId(codexMode === 'public'),
  );

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

  const handleCharacterFilterChange = useCallback((id: string) => {
    setCharacterFilterId(id);
    if (id) {
      setFilters((f) =>
        f.maxLevel === null && f.abilityRequirements.length === 0
          ? f
          : { ...f, maxLevel: null, abilityRequirements: [] },
      );
      setShowUnqualified(false);
    }
    writePersistedLibraryCharacterFilterId(id);
  }, []);

  const { data: characterResult } = useCharacter(
    loadPublicCodex ? characterFilterId || undefined : undefined,
  );
  const character = characterResult?.character ?? undefined;
  const { sortState, handleSort, sortItems } = useSort('name');
  const maxLevelFilterId = useId();

  const activeCharacter = characterFilterId ? character : undefined;
  const filteringByCharacter = Boolean(characterFilterId);

  const filterOptions = useMemo(() => buildFeatFilterOptions(feats), [feats]);

  const skillIdToName = useMemo(() => buildSkillIdToName(skills as Skill[]), [skills]);

  const { selectedPathIds, setSelectedPathIds, pathIndex, pathRecommendedIds, pathFilterActive } =
    usePathListFilter({
      entities: feats,
      kind: 'feats',
      enabled: loadPublicCodex,
    });

  const filteredFeats = useMemo(() => {
    if (!feats) return [];
    const filtered = filterFeats(feats, filters, {
      character: activeCharacter,
      showUnqualified,
      skills: skills as CodexSkillForFeat[],
      allFeats: feats,
      pathRecommendedIds,
    });
    return sortItems<Feat>(filtered);
  }, [feats, filters, sortItems, activeCharacter, showUnqualified, skills, pathRecommendedIds]);

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
      <CodexBrowseListShell
        search={filters.search}
        onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
        searchPlaceholder="Search names, tags, descriptions..."
        filters={
          <>
            <div className="mb-4 flex flex-wrap items-end gap-3 empty:hidden">
              <CharacterFilter
                value={characterFilterId}
                onChange={handleCharacterFilterChange}
                className="min-w-0 flex-1 border-b border-border-light pb-4"
                helpContent="Show only feats this character qualifies for. Level and ability requirements use the character's stats instead of the manual filters below."
              />
              {filteringByCharacter ? (
                <Button
                  type="button"
                  variant={showUnqualified ? 'outline' : 'secondary'}
                  onClick={() => setShowUnqualified((v) => !v)}
                  aria-pressed={showUnqualified}
                  className={cn(
                    'min-h-11 flex-shrink-0',
                    !showUnqualified &&
                      'border-success-300 bg-success-50 text-success-fg hover:bg-success-50 dark:border-success-600/50 dark:bg-success-900/30',
                  )}
                >
                  {showUnqualified ? 'Hide unqualified feats' : 'Show unqualified feats'}
                </Button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className={cn('filter-group', filteringByCharacter && 'opacity-60')}>
                <div className={FILTER_LABEL_ROW_CLASS}>
                  <label
                    htmlFor={maxLevelFilterId}
                    className="text-sm leading-5 font-medium text-text-secondary"
                  >
                    Max Required Level
                  </label>
                  <InfoTippy
                    content="Hide feats requiring higher levels."
                    label="Max required level filter help"
                    size="inline"
                  />
                </div>
                <FilterInput
                  id={maxLevelFilterId}
                  type="number"
                  min={0}
                  value={filteringByCharacter ? '' : (filters.maxLevel ?? '')}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      maxLevel: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder={filteringByCharacter ? SET_BY_CHARACTER_HINT : 'No limit'}
                  disabled={filteringByCharacter}
                />
              </div>

              <div className="md:col-span-2">
                <AbilityRequirementFilter
                  label="Ability/Defense Requirement"
                  abilities={filterOptions.abilReqAbilities}
                  requirements={filters.abilityRequirements}
                  onAdd={(req) =>
                    setFilters((f) => ({
                      ...f,
                      abilityRequirements: [...f.abilityRequirements, req],
                    }))
                  }
                  onRemove={(ability) =>
                    setFilters((f) => ({
                      ...f,
                      abilityRequirements: f.abilityRequirements.filter(
                        (r) => r.ability !== ability,
                      ),
                    }))
                  }
                  disabled={filteringByCharacter}
                  disabledHint={SET_BY_CHARACTER_HINT}
                />
              </div>

              <ChipSelect
                label="Category"
                placeholder="Choose category"
                options={filterOptions.categories.map((c) => ({ value: c, label: c }))}
                selectedValues={filters.categories}
                onSelect={(v) => setFilters((f) => ({ ...f, categories: [...f.categories, v] }))}
                onRemove={(v) =>
                  setFilters((f) => ({ ...f, categories: f.categories.filter((c) => c !== v) }))
                }
              />

              <ChipSelect
                label="Ability"
                placeholder="Choose ability"
                options={filterOptions.abilities.map((a) => ({ value: a, label: a }))}
                selectedValues={filters.abilities}
                onSelect={(v) => setFilters((f) => ({ ...f, abilities: [...f.abilities, v] }))}
                onRemove={(v) =>
                  setFilters((f) => ({ ...f, abilities: f.abilities.filter((a) => a !== v) }))
                }
              />

              <div className="md:col-span-2">
                <TagFilter
                  tags={filterOptions.tags}
                  selectedTags={filters.tags}
                  tagMode={filters.tagMode}
                  onSelect={(t) => setFilters((f) => ({ ...f, tags: [...f.tags, t] }))}
                  onRemove={(t) =>
                    setFilters((f) => ({ ...f, tags: f.tags.filter((tag) => tag !== t) }))
                  }
                  onModeChange={(mode) => setFilters((f) => ({ ...f, tagMode: mode }))}
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
                onChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    featTypeMode: v as 'all' | 'archetype' | 'character',
                  }))
                }
                placeholder={null}
              />

              <SelectFilter
                label="State Feats"
                labelAccessory={
                  <InfoTippy
                    content={STATE_FEAT_RESTRICTION_NOTICE}
                    label="State Feats filter help"
                  />
                }
                value={filters.stateFeatMode}
                options={[
                  { value: 'all', label: 'All Feats' },
                  { value: 'only', label: 'Only State Feats' },
                  { value: 'hide', label: 'Hide State Feats' },
                ]}
                onChange={(v) =>
                  setFilters((f) => ({ ...f, stateFeatMode: v as 'all' | 'only' | 'hide' }))
                }
                placeholder={null}
              />

              <ArchetypePathFilter
                options={pathIndex.options}
                selectedPathIds={selectedPathIds}
                onChange={setSelectedPathIds}
              />
            </div>
          </>
        }
        headerColumns={CODEX_FEAT_HEADER_COLUMNS}
        gridColumns={FEAT_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
        isLoading={isLoading}
        isEmpty={featFamilies.length === 0}
        emptyTitle={
          pathFilterActive ? pathFilterEmptyTitle('feats') : 'No feats match your filters.'
        }
      >
        {featFamilies.map(({ main, levels }) => (
          <CodexFeatRow
            key={main.id}
            feat={main}
            skillIdToName={skillIdToName}
            familyLevels={levels}
            nameChipLabels={
              pathFilterActive ? featPathChipNames(pathIndex, main, selectedPathIds) : undefined
            }
          />
        ))}
      </CodexBrowseListShell>
    </div>
  );
}
