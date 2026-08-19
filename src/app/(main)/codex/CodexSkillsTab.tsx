/**
 * Codex Skills Tab
 * ================
 * Skill list with filters: search, abilities, base skill, sub-skill mode,
 * plus shared CharacterFilter (known / not known / base-owned).
 */

'use client';

import { useState, useMemo, useCallback, useId } from 'react';
import {
  ArchetypePathFilter,
  ChipSelect,
  SelectFilter,
  CharacterFilter,
  FILTER_CONTROL_ROW_CLASS,
} from '@/components/patterns/filters';
import { CodexSkillRow } from '@/components/codex';
import { CodexBrowseListShell, ErrorDisplay as ErrorState } from '@/components/patterns';
import { useSort } from '@/hooks/use-sort';
import { CodexMyCodexEmpty } from './CodexMyCodexEmpty';
import { useCodexSkills, useCharacter, usePathListFilter, type Skill } from '@/hooks';
import { cn } from '@/lib/utils';
import {
  SKILL_GRID_COLUMNS,
  SKILL_HEADER_COLUMNS,
  buildSkillFilterOptions,
  buildSkillIdToName,
  collectCharacterSkillKeys,
  filterSkills,
  sortSkillsForBaseFilter,
  type SkillKnownMode,
  type SkillListFilters,
} from '@/lib/codex/skill-list';
import {
  readInitialLibraryCharacterFilterId,
  writePersistedLibraryCharacterFilterId,
} from '@/lib/library/character-filter-persistence';
import {
  pathChipLabelsForEntity,
  pathFilterEmptyTitle,
} from '@/lib/game/path-recommendation-index';

const SKILL_CHARACTER_FILTER_HELP =
  'Filter this list by a character you own. Optionally keep only skills they know, skills they do not know, or sub-skills for a base skill they have.';

export function CodexSkillsTab({ codexMode = 'public' }: { codexMode?: 'public' | 'my' }) {
  const loadPublicCodex = codexMode === 'public';
  const { data: skills, isLoading, error, refetch } = useCodexSkills({ enabled: loadPublicCodex });
  const { sortState, handleSort, sortItems } = useSort('name');
  const baseOwnedId = useId();

  const [characterFilterId, setCharacterFilterId] = useState(() =>
    readInitialLibraryCharacterFilterId(codexMode === 'public'),
  );

  const [filters, setFilters] = useState<SkillListFilters>({
    search: '',
    abilities: [],
    baseSkill: '',
    subSkillMode: 'all',
    knownMode: 'all',
    baseSkillOwnedOnly: false,
  });

  const handleCharacterFilterChange = useCallback((id: string) => {
    setCharacterFilterId(id);
    if (!id) {
      setFilters((f) => ({ ...f, knownMode: 'all', baseSkillOwnedOnly: false }));
    }
    writePersistedLibraryCharacterFilterId(id);
  }, []);

  const { data: characterResult } = useCharacter(
    loadPublicCodex ? characterFilterId || undefined : undefined,
  );
  const character = characterResult?.character ?? undefined;
  const hasCharacter = Boolean(characterFilterId && character);

  const { selectedPathIds, setSelectedPathIds, pathIndex, pathRecommendedIds, pathFilterActive } =
    usePathListFilter({
      entities: skills,
      kind: 'skills',
      enabled: loadPublicCodex,
    });

  const skillIdToName = useMemo(() => buildSkillIdToName(skills), [skills]);

  const characterKnownIds = useMemo(() => {
    if (!characterFilterId || !character) return null;
    return collectCharacterSkillKeys(character.skills);
  }, [characterFilterId, character]);

  const filterOptions = useMemo(
    () => buildSkillFilterOptions(skills, skillIdToName, { includeCategoryBaseSkills: true }),
    [skills, skillIdToName],
  );

  const filteredSkills = useMemo(() => {
    if (!skills) return [];
    const filtered = filterSkills(
      skills,
      filters,
      skillIdToName,
      characterKnownIds,
      pathRecommendedIds,
    );
    if (filters.baseSkill) return sortSkillsForBaseFilter(filtered, filters.baseSkill);
    return sortItems<Skill>(filtered);
  }, [skills, filters, sortItems, skillIdToName, characterKnownIds, pathRecommendedIds]);

  if (codexMode === 'my') {
    return <CodexMyCodexEmpty />;
  }

  if (error) return <ErrorState message="Failed to load skills" onRetry={() => refetch()} />;

  return (
    <CodexBrowseListShell
      search={filters.search}
      onSearchChange={(v) => setFilters((f) => ({ ...f, search: v }))}
      searchPlaceholder="Search names, descriptions..."
      filters={
        <>
          <CharacterFilter
            value={characterFilterId}
            onChange={handleCharacterFilterChange}
            className="mb-4 max-w-md min-w-0 border-b border-border-light pb-4"
            helpContent={SKILL_CHARACTER_FILTER_HELP}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ChipSelect
              label="Ability"
              placeholder="Choose ability"
              options={filterOptions.abilities.map((a) => ({
                value: a,
                label:
                  typeof a === 'string' && a.length > 0
                    ? a.charAt(0).toUpperCase() + a.slice(1)
                    : String(a),
              }))}
              selectedValues={filters.abilities}
              onSelect={(v) => setFilters((f) => ({ ...f, abilities: [...f.abilities, v] }))}
              onRemove={(v) =>
                setFilters((f) => ({ ...f, abilities: f.abilities.filter((a) => a !== v) }))
              }
            />

            <SelectFilter
              label="Base Skill"
              value={filters.baseSkill}
              options={filterOptions.baseSkills.map((s) => ({ value: s, label: s }))}
              onChange={(v) => setFilters((f) => ({ ...f, baseSkill: v }))}
              placeholder="Any"
            />

            <SelectFilter
              label="Skill Type"
              value={filters.subSkillMode}
              options={[
                { value: 'all', label: 'All Skills' },
                { value: 'only', label: 'Only Sub-Skills' },
                { value: 'hide', label: 'Hide Sub-Skills' },
              ]}
              onChange={(v) =>
                setFilters((f) => ({ ...f, subSkillMode: v as 'all' | 'only' | 'hide' }))
              }
              placeholder={null}
            />

            {hasCharacter ? (
              <>
                <SelectFilter
                  label="Known"
                  value={filters.knownMode ?? 'all'}
                  options={[
                    { value: 'all', label: 'All skills' },
                    { value: 'known', label: 'Known' },
                    { value: 'not-known', label: 'Not known' },
                  ]}
                  onChange={(v) => setFilters((f) => ({ ...f, knownMode: v as SkillKnownMode }))}
                  placeholder={null}
                />

                <div className="filter-group min-w-0">
                  <div className="mb-1 text-sm font-medium text-text-secondary">Base skill</div>
                  <label
                    htmlFor={baseOwnedId}
                    className={cn(FILTER_CONTROL_ROW_CLASS, 'cursor-pointer gap-2')}
                  >
                    <input
                      id={baseOwnedId}
                      type="checkbox"
                      className="h-4 w-4 shrink-0 rounded border-border-light text-primary-fg focus:ring-primary-outline-border"
                      checked={Boolean(filters.baseSkillOwnedOnly)}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, baseSkillOwnedOnly: e.target.checked }))
                      }
                    />
                    <span className="text-sm text-text-primary">
                      Sub-skills whose base skill I have
                    </span>
                  </label>
                </div>
              </>
            ) : null}

            <ArchetypePathFilter
              options={pathIndex.options}
              selectedPathIds={selectedPathIds}
              onChange={setSelectedPathIds}
            />
          </div>
        </>
      }
      headerColumns={SKILL_HEADER_COLUMNS}
      gridColumns={SKILL_GRID_COLUMNS}
      sortState={sortState}
      onSort={handleSort}
      isLoading={isLoading}
      isEmpty={filteredSkills.length === 0}
      emptyTitle={
        pathFilterActive ? pathFilterEmptyTitle('skills') : 'No skills match your filters.'
      }
    >
      {filteredSkills.map((skill: Skill) => (
        <CodexSkillRow
          key={skill.id}
          skill={skill}
          skillIdToName={skillIdToName}
          nameChipLabels={
            pathFilterActive
              ? pathChipLabelsForEntity(pathIndex, skill.id, selectedPathIds)
              : undefined
          }
        />
      ))}
    </CodexBrowseListShell>
  );
}
