/**
 * Codex Skills Tab
 * ================
 * Skill list with filters: search, abilities, base skill, sub-skill mode.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  ChipSelect,
  SelectFilter,
  FilterSection,
  CodexSkillRow,
} from '@/components/codex';
import {
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import { CodexMyCodexEmpty } from './CodexMyCodexEmpty';
import { EmptyState } from '@/components/ui';
import { useCodexSkills, type Skill } from '@/hooks';
import {
  SKILL_GRID_COLUMNS,
  SKILL_HEADER_COLUMNS,
  buildSkillFilterOptions,
  buildSkillIdToName,
  filterSkills,
  sortSkillsForBaseFilter,
  type SkillListFilters,
} from '@/lib/codex/skill-list';

interface SkillFilters extends SkillListFilters {
  subSkillMode: 'all' | 'only' | 'hide';
}

function SkillCard({ skill, skillIdToName }: { skill: Skill; skillIdToName: Map<string, string> }) {
  return <CodexSkillRow skill={skill} skillIdToName={skillIdToName} />;
}

export function CodexSkillsTab({ codexMode = 'public' }: { codexMode?: 'public' | 'my' }) {
  const loadPublicCodex = codexMode === 'public';
  const { data: skills, isLoading, error, refetch } = useCodexSkills({ enabled: loadPublicCodex });
  const { sortState, handleSort, sortItems } = useSort('name');

  const skillIdToName = useMemo(() => buildSkillIdToName(skills), [skills]);

  const [filters, setFilters] = useState<SkillFilters>({
    search: '',
    abilities: [],
    baseSkill: '',
    subSkillMode: 'all',
  });

  const filterOptions = useMemo(
    () => buildSkillFilterOptions(skills, skillIdToName, { includeCategoryBaseSkills: true }),
    [skills, skillIdToName]
  );

  const filteredSkills = useMemo(() => {
    if (!skills) return [];
    const filtered = filterSkills(skills, filters, skillIdToName);
    if (filters.baseSkill) return sortSkillsForBaseFilter(filtered, filters.baseSkill);
    return sortItems<Skill>(filtered);
  }, [skills, filters, sortItems, skillIdToName]);

  if (codexMode === 'my') {
    return <CodexMyCodexEmpty />;
  }

  if (error) return <ErrorState message="Failed to load skills" onRetry={() => refetch()} />;

  return (
    <div>
      <div className="mb-4">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Search names, descriptions..."
        />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ChipSelect
            label="Ability"
            placeholder="Choose ability"
            options={filterOptions.abilities.map(a => ({ value: a, label: typeof a === 'string' && a.length > 0 ? a.charAt(0).toUpperCase() + a.slice(1) : String(a) }))}
            selectedValues={filters.abilities}
            onSelect={(v) => setFilters(f => ({ ...f, abilities: [...f.abilities, v] }))}
            onRemove={(v) => setFilters(f => ({ ...f, abilities: f.abilities.filter(a => a !== v) }))}
          />

          <SelectFilter
            label="Base Skill"
            value={filters.baseSkill}
            options={filterOptions.baseSkills.map(s => ({ value: s, label: s }))}
            onChange={(v) => setFilters(f => ({ ...f, baseSkill: v }))}
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
            onChange={(v) => setFilters(f => ({ ...f, subSkillMode: v as 'all' | 'only' | 'hide' }))}
            placeholder={null}
          />
        </div>
      </FilterSection>

      <ListHeader
        columns={SKILL_HEADER_COLUMNS}
        gridColumns={SKILL_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredSkills.length === 0 ? (
          <EmptyState title="No skills match your filters." size="sm" />
        ) : (
          filteredSkills.map((skill: Skill) => (
            <SkillCard key={skill.id} skill={skill} skillIdToName={skillIdToName} />
          ))
        )}
      </div>
    </div>
  );
}
