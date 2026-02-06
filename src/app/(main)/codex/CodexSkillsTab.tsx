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
} from '@/components/codex';
import {
  SearchInput,
  SortHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import { useRTDBSkills, type RTDBSkill as Skill } from '@/hooks';

const SKILL_GRID_COLUMNS = '1.5fr 1fr 1fr 40px';

interface SkillFilters {
  search: string;
  abilities: string[];
  baseSkill: string;
  subSkillMode: 'all' | 'only' | 'hide';
}

function SkillCard({ skill, skillIdToName }: { skill: Skill; skillIdToName: Map<string, string> }) {
  const isSubSkill = skill.base_skill_id !== undefined;
  const baseSkillName = isSubSkill ? (skillIdToName.get(String(skill.base_skill_id)) || '-') : '-';

  const expandedContent = skill.description ? (
    <div>
      <p className="text-text-secondary text-sm mb-2 p-3 bg-surface-alt rounded-lg">{skill.description}</p>
      {isSubSkill && (
        <p className="text-sm text-primary-600">
          Sub-skill of: <strong>{baseSkillName}</strong>
        </p>
      )}
    </div>
  ) : undefined;

  const displayName = isSubSkill ? `↳ ${skill.name}` : skill.name;

  return (
    <GridListRow
      id={skill.id}
      name={displayName}
      description={!skill.description ? undefined : undefined}
      gridColumns={SKILL_GRID_COLUMNS}
      columns={[
        { key: 'Ability', value: skill.ability || '-', highlight: false },
        { key: 'Base Skill', value: baseSkillName, highlight: isSubSkill },
      ]}
      expandedContent={expandedContent}
    />
  );
}

export function CodexSkillsTab() {
  const { data: skills, isLoading, error } = useRTDBSkills();
  const { sortState, handleSort, sortItems } = useSort('name');

  const skillIdToName = useMemo(() => {
    if (!skills) return new Map<string, string>();
    return new Map(skills.map(s => [s.id, s.name]));
  }, [skills]);

  const [filters, setFilters] = useState<SkillFilters>({
    search: '',
    abilities: [],
    baseSkill: '',
    subSkillMode: 'all',
  });

  const filterOptions = useMemo(() => {
    if (!skills) return { abilities: [], baseSkills: [] };

    const abilities = new Set<string>();
    const baseSkills = new Set<string>();

    skills.forEach(s => {
      if (s.ability && typeof s.ability === 'string') {
        s.ability.split(',').forEach(ab => {
          const trimmed = ab.trim();
          if (trimmed) abilities.add(trimmed);
        });
      }
      if (s.category && typeof s.category === 'string') baseSkills.add(s.category);
      if (s.base_skill_id !== undefined) {
        const baseSkillName = skillIdToName.get(String(s.base_skill_id));
        if (baseSkillName) baseSkills.add(baseSkillName);
      }
    });

    return {
      abilities: Array.from(abilities).sort(),
      baseSkills: Array.from(baseSkills).sort(),
    };
  }, [skills, skillIdToName]);

  const filteredSkills = useMemo(() => {
    if (!skills) return [];

    const filtered = skills.filter(s => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!s.name.toLowerCase().includes(searchLower) &&
          !s.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (filters.abilities.length > 0) {
        const skillAbilities = s.ability?.split(',').map(a => a.trim()) || [];
        const hasMatchingAbility = filters.abilities.some(filterAb =>
          skillAbilities.includes(filterAb)
        );
        if (!hasMatchingAbility) return false;
      }

      if (filters.baseSkill) {
        const isThisBaseSkill = s.name === filters.baseSkill;
        const baseSkillName = s.base_skill_id !== undefined ? skillIdToName.get(String(s.base_skill_id)) : undefined;
        const hasThisBaseSkill = baseSkillName === filters.baseSkill;
        if (!isThisBaseSkill && !hasThisBaseSkill) return false;
      }

      const isSubSkill = s.base_skill_id !== undefined;

      if (filters.subSkillMode === 'only' && !isSubSkill) return false;
      if (filters.subSkillMode === 'hide' && isSubSkill) return false;

      return true;
    });

    if (filters.baseSkill) {
      return filtered.sort((a, b) => {
        const aIsBase = a.name === filters.baseSkill;
        const bIsBase = b.name === filters.baseSkill;
        if (aIsBase && !bIsBase) return -1;
        if (!aIsBase && bIsBase) return 1;
        return a.name.localeCompare(b.name);
      });
    }
    return sortItems(filtered);
  }, [skills, filters, sortItems, skillIdToName]);

  if (error) return <ErrorState message="Failed to load skills" />;

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
            placeholder="All Skills"
          />
        </div>
      </FilterSection>

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: SKILL_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="ABILITIES" col="ability" sortState={sortState} onSort={handleSort} />
        <SortHeader label="BASE SKILL" col="base_skill" sortState={sortState} onSort={handleSort} />
      </div>

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredSkills.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No skills match your filters.</div>
        ) : (
          filteredSkills.map(skill => (
            <SkillCard key={skill.id} skill={skill} skillIdToName={skillIdToName} />
          ))
        )}
      </div>
    </div>
  );
}
