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
  type AbilityRequirement,
} from '@/components/codex';
import {
  SearchInput,
  SortHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import { Input } from '@/components/ui';
import { useCodexFeats, useCodexSkills, type Feat, type Skill } from '@/hooks';
import { formatAbilityList } from '@/lib/utils';

const FEAT_GRID_COLUMNS = '1.5fr 0.8fr 1fr 0.8fr 0.8fr 1fr 40px';

interface FeatFilters {
  search: string;
  maxLevel: number | null;
  abilityRequirements: AbilityRequirement[];
  categories: string[];
  abilities: string[];
  tags: string[];
  tagMode: 'any' | 'all';
  featTypeMode: 'all' | 'archetype' | 'character';
  stateFeatMode: 'all' | 'only' | 'hide';
}

function FeatCard({ feat, skillIdToName }: { feat: Feat; skillIdToName: Map<string, string> }) {
  const detailSections: Array<{ label: string; chips: { name: string; category?: 'default' | 'tag' | 'skill' | 'archetype' }[]; hideLabelIfSingle?: boolean }> = [];

  const typeChips: { name: string; category: 'skill' | 'archetype' }[] = [];
  if (feat.char_feat) typeChips.push({ name: 'Character Feat', category: 'skill' });
  else typeChips.push({ name: 'Archetype Feat', category: 'archetype' });
  if (feat.state_feat) typeChips.push({ name: 'State Feat', category: 'archetype' });
  if (typeChips.length > 0) {
    detailSections.push({ label: 'Type', chips: typeChips, hideLabelIfSingle: true });
  }

  if (feat.category) {
    detailSections.push({ label: 'Category', chips: [{ name: feat.category, category: 'default' }], hideLabelIfSingle: true });
  }

  const tagChips = feat.tags?.map(tag => ({ name: tag, category: 'tag' as const })) || [];
  if (tagChips.length > 0) {
    detailSections.push({ label: 'Tags', chips: tagChips, hideLabelIfSingle: true });
  }

  const abilityReqChips = (feat.ability_req || []).map((a, i) => {
    const val = feat.abil_req_val?.[i];
    return { name: `${a}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'default' as const };
  });
  if (abilityReqChips.length > 0) {
    detailSections.push({ label: 'Ability Requirements', chips: abilityReqChips });
  }

  const skillReqChips = (feat.skill_req || []).map((id, i) => {
    const label = skillIdToName.get(String(id)) || String(id);
    const val = feat.skill_req_val?.[i];
    return { name: `${label}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'skill' as const };
  });
  if (skillReqChips.length > 0) {
    detailSections.push({ label: 'Skill Requirements', chips: skillReqChips });
  }

  return (
    <GridListRow
      id={feat.id}
      name={feat.name}
      description={feat.description}
      gridColumns={FEAT_GRID_COLUMNS}
      columns={[
        { key: 'Req. Level', value: feat.lvl_req || '-' },
        { key: 'Category', value: feat.category || '-' },
        {
          key: 'Ability',
          value: formatAbilityList(feat.ability),
        },
        { key: 'Recovery', value: feat.rec_period || '-' },
        { key: 'Uses', value: feat.uses_per_rec || '-' },
      ]}
      detailSections={detailSections.length > 0 ? detailSections : undefined}
    />
  );
}

export function CodexFeatsTab() {
  const { data: feats, isLoading, error } = useCodexFeats();
  const { data: skills = [] } = useCodexSkills();
  const { sortState, handleSort, sortItems } = useSort('name');

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

  const filterOptions = useMemo(() => {
    if (!feats) return { levels: [], abilities: [], categories: [], tags: [], abilReqAbilities: [] };

    const levels = new Set<number>();
    const abilities = new Set<string>();
    const categories = new Set<string>();
    const tags = new Set<string>();
    const abilReqAbilities = new Set<string>();

    feats.forEach((f: Feat) => {
      if (f.lvl_req > 0) levels.add(f.lvl_req);
      if (Array.isArray(f.ability)) {
        f.ability.forEach((a: string) => abilities.add(a));
      } else if (f.ability) {
        abilities.add(f.ability);
      }
      if (f.category) categories.add(f.category);
      f.tags?.forEach((t: string) => tags.add(t));
      f.ability_req?.forEach((a: string) => abilReqAbilities.add(a));
    });

    return {
      levels: Array.from(levels).sort((a, b) => a - b),
      abilities: Array.from(abilities).sort(),
      categories: Array.from(categories).sort(),
      tags: Array.from(tags).sort(),
      abilReqAbilities: Array.from(abilReqAbilities).sort(),
    };
  }, [feats]);

  const skillIdToName = useMemo(() => {
    const map = new Map<string, string>();
    (skills as Skill[]).forEach((s) => {
      map.set(String(s.id), s.name);
    });
    return map;
  }, [skills]);

  const filteredFeats = useMemo(() => {
    if (!feats) return [];

    const filtered = feats.filter((f: Feat) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          f.name.toLowerCase().includes(searchLower) ||
          f.description?.toLowerCase().includes(searchLower) ||
          f.tags?.some(t => t.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      if (filters.maxLevel !== null && f.lvl_req > filters.maxLevel) {
        return false;
      }

      if (filters.featTypeMode === 'archetype' && f.char_feat) return false;
      if (filters.featTypeMode === 'character' && !f.char_feat) return false;

      if (filters.stateFeatMode === 'only' && !f.state_feat) return false;
      if (filters.stateFeatMode === 'hide' && f.state_feat) return false;

      for (const req of filters.abilityRequirements) {
        const index = f.ability_req?.indexOf(req.ability) ?? -1;
        if (index !== -1) {
          const val = f.abil_req_val?.[index];
          if (typeof val === 'number' && val > req.maxValue) return false;
        }
      }

      if (filters.categories.length > 0 && !filters.categories.includes(f.category)) {
        return false;
      }

      if (filters.abilities.length > 0) {
        const featAbilities = Array.isArray(f.ability)
          ? f.ability
          : f.ability
            ? [f.ability]
            : [];
        if (!featAbilities.some(a => filters.abilities.includes(a))) {
          return false;
        }
      }

      if (filters.tags.length > 0) {
        if (filters.tagMode === 'all') {
          if (!filters.tags.every(t => f.tags?.includes(t))) return false;
        } else {
          if (!filters.tags.some(t => f.tags?.includes(t))) return false;
        }
      }

      return true;
    });
    return sortItems<Feat>(filtered);
  }, [feats, filters, sortItems]);

  if (error) {
    return <ErrorState message="Failed to load feats" />;
  }

  return (
    <div>
      <div className="mb-4">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Search names, tags, descriptions..."
        />
      </div>

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
            <p className="text-xs text-text-muted mt-1">Hide feats requiring higher levels</p>
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
            placeholder="All"
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
            placeholder="All Feats"
          />
        </div>
      </FilterSection>

      <div
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: FEAT_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="REQ. LEVEL" col="lvl_req" sortState={sortState} onSort={handleSort} />
        <SortHeader label="CATEGORY" col="category" sortState={sortState} onSort={handleSort} />
        <SortHeader label="ABILITY" col="ability" sortState={sortState} onSort={handleSort} />
        <SortHeader label="RECOVERY" col="rec_period" sortState={sortState} onSort={handleSort} />
        <SortHeader label="USES" col="uses_per_rec" sortState={sortState} onSort={handleSort} />
      </div>

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredFeats.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No feats match your filters.</div>
        ) : (
          filteredFeats.map(feat => (
            <FeatCard key={feat.id} feat={feat} skillIdToName={skillIdToName} />
          ))
        )}
      </div>
    </div>
  );
}
