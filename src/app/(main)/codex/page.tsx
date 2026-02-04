/**
 * Codex Page - Full Implementation
 * =================================
 * Complete game reference matching vanilla site functionality.
 * Features all filters: level req, ability req, categories, tags with Any/All, feat types, state feats.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn, formatDamageDisplay } from '@/lib/utils';
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
  LoadingSpinner as LoadingState,
  ErrorDisplay as ErrorState,
  PropertyChipList,
  GridListRow,
  type ChipData,
} from '@/components/shared';
import { PageContainer, PageHeader, TabNavigation, Spinner, Input } from '@/components/ui';
import { 
  useRTDBFeats, 
  useRTDBSkills, 
  useSpecies, 
  useTraits,
  useItemProperties,
  useEquipment,
  useParts,
  resolveTraitIds,
  type RTDBFeat as Feat,
  type RTDBSkill as Skill,
  type Species,
  type Trait,
  type ItemProperty,
} from '@/hooks';

type TabId = 'feats' | 'skills' | 'species' | 'equipment' | 'properties' | 'parts';

const TABS: { id: TabId; label: string; labelMobile?: string }[] = [
  { id: 'feats', label: 'Feats' },
  { id: 'skills', label: 'Skills' },
  { id: 'species', label: 'Species' },
  { id: 'parts', label: 'Power & Technique Parts', labelMobile: 'Parts' },
  { id: 'properties', label: 'Armament Properties', labelMobile: 'Properties' },
  { id: 'equipment', label: 'Equipment' },
];

export default function CodexPage() {
  const [activeTab, setActiveTab] = useState<TabId>('feats');

  const tabs = TABS.map(tab => ({
    id: tab.id,
    label: tab.label,
    labelMobile: tab.labelMobile,
  }));

  return (
    <PageContainer size="xl">
      {/* Header */}
      <PageHeader
        title="Codex"
        description="Complete reference for the Realms RPG system."
      />

      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabId)}
        variant="underline"
        className="mb-6"
      />

      {/* Tab Content */}
      {activeTab === 'feats' && <FeatsTab />}
      {activeTab === 'skills' && <SkillsTab />}
      {activeTab === 'species' && <SpeciesTab />}
      {activeTab === 'equipment' && <EquipmentTab />}
      {activeTab === 'properties' && <PropertiesTab />}
      {activeTab === 'parts' && <PartsTab />}
    </PageContainer>
  );
}

// =============================================================================
// FEATS TAB - Full filter implementation matching vanilla site
// =============================================================================

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

function FeatsTab() {
  const { data: feats, isLoading, error } = useRTDBFeats();
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  
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

  // Extract unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!feats) return { levels: [], abilities: [], categories: [], tags: [], abilReqAbilities: [] };
    
    const levels = new Set<number>();
    const abilities = new Set<string>();
    const categories = new Set<string>();
    const tags = new Set<string>();
    const abilReqAbilities = new Set<string>();

    feats.forEach(f => {
      if (f.lvl_req > 0) levels.add(f.lvl_req);
      if (f.ability) abilities.add(f.ability);
      if (f.category) categories.add(f.category);
      f.tags?.forEach(t => tags.add(t));
      f.ability_req?.forEach(a => abilReqAbilities.add(a));
    });

    return {
      levels: Array.from(levels).sort((a, b) => a - b),
      abilities: Array.from(abilities).sort(),
      categories: Array.from(categories).sort(),
      tags: Array.from(tags).sort(),
      abilReqAbilities: Array.from(abilReqAbilities).sort(),
    };
  }, [feats]);

  // Apply filters
  const filteredFeats = useMemo(() => {
    if (!feats) return [];

    return feats.filter(f => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          f.name.toLowerCase().includes(searchLower) ||
          f.description?.toLowerCase().includes(searchLower) ||
          f.tags?.some(t => t.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Level requirement filter
      if (filters.maxLevel !== null && f.lvl_req > filters.maxLevel) {
        return false;
      }

      // Feat type filter (All/Archetype/Character)
      if (filters.featTypeMode === 'archetype' && f.char_feat) return false;
      if (filters.featTypeMode === 'character' && !f.char_feat) return false;

      // State feat filter
      if (filters.stateFeatMode === 'only' && !f.state_feat) return false;
      if (filters.stateFeatMode === 'hide' && f.state_feat) return false;

      // Ability requirement filter
      for (const req of filters.abilityRequirements) {
        const index = f.ability_req?.indexOf(req.ability) ?? -1;
        if (index !== -1) {
          const val = f.abil_req_val?.[index];
          if (typeof val === 'number' && val > req.maxValue) return false;
        }
      }

      // Category filter (multi-select)
      if (filters.categories.length > 0 && !filters.categories.includes(f.category)) {
        return false;
      }

      // Ability filter (multi-select)
      if (filters.abilities.length > 0 && (!f.ability || !filters.abilities.includes(f.ability))) {
        return false;
      }

      // Tags filter with Any/All mode
      if (filters.tags.length > 0) {
        if (filters.tagMode === 'all') {
          if (!filters.tags.every(t => f.tags?.includes(t))) return false;
        } else {
          if (!filters.tags.some(t => f.tags?.includes(t))) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const col = sortState.col as keyof Feat;
      const aVal = a[col];
      const bVal = b[col];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortState.dir * aVal.localeCompare(bVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortState.dir * (aVal - bVal);
      }
      return 0;
    });
  }, [feats, filters, sortState]);

  const handleSort = useCallback((col: string) => {
    setSortState(prev => ({
      col,
      dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : 1,
    }));
  }, []);

  if (error) {
    return <ErrorState message="Failed to load feats" />;
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Search names, tags, descriptions..."
        />
      </div>

      {/* Filters Panel */}
      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Required Level */}
          {/* Required Level - Input filter */}
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

          {/* Ability/Defense Requirement */}
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

          {/* Category */}
          <ChipSelect
            label="Category"
            placeholder="Choose category"
            options={filterOptions.categories.map(c => ({ value: c, label: c }))}
            selectedValues={filters.categories}
            onSelect={(v) => setFilters(f => ({ ...f, categories: [...f.categories, v] }))}
            onRemove={(v) => setFilters(f => ({ ...f, categories: f.categories.filter(c => c !== v) }))}
          />

          {/* Ability */}
          <ChipSelect
            label="Ability"
            placeholder="Choose ability"
            options={filterOptions.abilities.map(a => ({ value: a, label: a }))}
            selectedValues={filters.abilities}
            onSelect={(v) => setFilters(f => ({ ...f, abilities: [...f.abilities, v] }))}
            onRemove={(v) => setFilters(f => ({ ...f, abilities: f.abilities.filter(a => a !== v) }))}
          />

          {/* Tags */}
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

          {/* Feat Type */}
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

          {/* State Feats */}
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

      {/* Column Headers - aligned with GridListRow grid */}
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

      {/* Feat List */}
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredFeats.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No feats match your filters.</div>
        ) : (
          filteredFeats.map(feat => (
            <FeatCard key={feat.id} feat={feat} />
          ))
        )}
      </div>
    </div>
  );
}

// Grid columns for feats list
const FEAT_GRID_COLUMNS = '1.5fr 0.8fr 1fr 0.8fr 0.8fr 1fr 40px';

function FeatCard({ feat }: { feat: Feat }) {
  // Build badges from feat type flags
  const badges: Array<{ label: string; color: 'blue' | 'purple' | 'gray' }> = [];
  if (feat.char_feat) badges.push({ label: 'Character Feat', color: 'blue' });
  if (feat.state_feat) badges.push({ label: 'State Feat', color: 'purple' });
  if (feat.category) badges.push({ label: feat.category, color: 'gray' });
  
  // Build tag chips
  const tagChips = feat.tags?.map(tag => ({
    name: tag,
    category: 'tag' as const,
  })) || [];

  // Build requirements content
  const requirementsContent = (
    <div className="space-y-1 text-sm">
      {feat.ability_req?.length > 0 && (
        <div>
          <span className="font-medium text-text-secondary">Ability Requirements:</span>{' '}
          <span className="text-text-muted">
            {feat.ability_req.map((a, i) => {
              const val = feat.abil_req_val?.[i];
              return `${a}${typeof val === 'number' ? ` ${val}` : ''}`;
            }).join(', ')}
          </span>
        </div>
      )}
      {feat.skill_req?.length > 0 && (
        <div>
          <span className="font-medium text-text-secondary">Skill Requirements:</span>{' '}
          <span className="text-text-muted">
            {feat.skill_req.map((s, i) => {
              const val = feat.skill_req_val?.[i];
              return `${s}${typeof val === 'number' ? ` ${val}` : ''}`;
            }).join(', ')}
          </span>
        </div>
      )}
    </div>
  );

  const hasRequirements = (feat.ability_req?.length ?? 0) > 0 || (feat.skill_req?.length ?? 0) > 0;

  return (
    <GridListRow
      id={feat.id}
      name={feat.name}
      description={feat.description}
      gridColumns={FEAT_GRID_COLUMNS}
      columns={[
        { key: 'Req. Level', value: feat.lvl_req || '-' },
        { key: 'Category', value: feat.category || '-' },
        { key: 'Ability', value: feat.ability || '-' },
        { key: 'Recovery', value: feat.rec_period || '-' },
        { key: 'Uses', value: feat.uses_per_rec || '-' },
      ]}
      badges={badges}
      chips={tagChips}
      chipsLabel="Tags"
      requirements={hasRequirements ? requirementsContent : undefined}
    />
  );
}

// =============================================================================
// SKILLS TAB
// =============================================================================

interface SkillFilters {
  search: string;
  abilities: string[];
  baseSkill: string;
  subSkillMode: 'all' | 'only' | 'hide';
}


function SkillsTab() {
  const { data: skills, isLoading, error } = useRTDBSkills();
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  
  // Create a lookup map from skill ID to skill name for display
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
      // Handle comma-separated abilities
      if (s.ability && typeof s.ability === 'string') {
        s.ability.split(',').forEach(ab => {
          const trimmed = ab.trim();
          if (trimmed) abilities.add(trimmed);
        });
      }
      if (s.category && typeof s.category === 'string') baseSkills.add(s.category);
      // Use base_skill_id to look up the base skill name
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

    return skills.filter(s => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!s.name.toLowerCase().includes(searchLower) && 
            !s.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Handle comma-separated abilities in filter
      if (filters.abilities.length > 0) {
        const skillAbilities = s.ability?.split(',').map(a => a.trim()) || [];
        const hasMatchingAbility = filters.abilities.some(filterAb => 
          skillAbilities.includes(filterAb)
        );
        if (!hasMatchingAbility) return false;
      }

      // Filter by base skill - shows skills that ARE this base skill or have it as their parent
      if (filters.baseSkill) {
        const isThisBaseSkill = s.name === filters.baseSkill;
        // Look up base skill name by ID
        const baseSkillName = s.base_skill_id !== undefined ? skillIdToName.get(String(s.base_skill_id)) : undefined;
        const hasThisBaseSkill = baseSkillName === filters.baseSkill;
        if (!isThisBaseSkill && !hasThisBaseSkill) return false;
      }

      // Sub-skill filtering logic
      const isSubSkill = s.base_skill_id !== undefined;
      
      if (filters.subSkillMode === 'only' && !isSubSkill) return false;
      if (filters.subSkillMode === 'hide' && isSubSkill) return false;

      return true;
    }).sort((a, b) => {
      // Special sorting when filtering by base skill: put base skill at top, then sub-skills
      if (filters.baseSkill) {
        const aIsBase = a.name === filters.baseSkill;
        const bIsBase = b.name === filters.baseSkill;
        if (aIsBase && !bIsBase) return -1;
        if (!aIsBase && bIsBase) return 1;
        // Both are sub-skills, sort by name
        return a.name.localeCompare(b.name);
      }
      
      const col = sortState.col as keyof Skill;
      const aVal = a[col];
      const bVal = b[col];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortState.dir * aVal.localeCompare(bVal);
      }
      return 0;
    });
  }, [skills, filters, sortState]);

  const handleSort = useCallback((col: string) => {
    setSortState(prev => ({
      col,
      dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : 1,
    }));
  }, []);

  if (error) return <ErrorState message="Failed to load skills" />;

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Search names, descriptions..."
        />
      </div>

      {/* Filters Panel */}
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

      {/* Column Headers - aligned with GridListRow grid */}
      <div 
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: SKILL_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="ABILITIES" col="ability" sortState={sortState} onSort={handleSort} />
        <SortHeader label="BASE SKILL" col="base_skill" sortState={sortState} onSort={handleSort} />
      </div>

      {/* Skill List */}
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

// Grid columns for skills list
const SKILL_GRID_COLUMNS = '1.5fr 1fr 1fr 40px';

function SkillCard({ skill, skillIdToName }: { skill: Skill; skillIdToName: Map<string, string> }) {
  const isSubSkill = skill.base_skill_id !== undefined;
  const baseSkillName = isSubSkill ? (skillIdToName.get(String(skill.base_skill_id)) || '-') : '-';
  
  // Build custom expanded content for sub-skill info
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
  
  // Custom name display with sub-skill indicator
  const displayName = isSubSkill ? `↳ ${skill.name}` : skill.name;

  return (
    <GridListRow
      id={skill.id}
      name={displayName}
      description={!skill.description ? undefined : undefined} // Use expandedContent instead
      gridColumns={SKILL_GRID_COLUMNS}
      columns={[
        { key: 'Ability', value: skill.ability || '-', highlight: false },
        { key: 'Base Skill', value: baseSkillName, highlight: isSubSkill },
      ]}
      expandedContent={expandedContent}
    />
  );
}

// =============================================================================
// SPECIES TAB
// =============================================================================

interface SpeciesFilters {
  search: string;
  types: string[];
  sizes: string[];
}

function SpeciesTab() {
  const { data: species, isLoading, error } = useSpecies();
  const { data: allTraits } = useTraits();
  const { data: allSkills } = useRTDBSkills();
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  
  // Build skill ID to name map for resolving species skills
  const skillIdToName = useMemo(() => {
    if (!allSkills) return new Map<string, string>();
    return new Map(allSkills.map(s => [s.id, s.name]));
  }, [allSkills]);
  
  const [filters, setFilters] = useState<SpeciesFilters>({
    search: '',
    types: [],
    sizes: [],
  });

  const filterOptions = useMemo(() => {
    if (!species) return { types: [], sizes: [] };
    
    const types = new Set<string>();
    const sizes = new Set<string>();

    species.forEach(s => {
      if (s.type) types.add(s.type);
      s.sizes?.forEach(sz => sizes.add(sz));
    });

    return {
      types: Array.from(types).sort(),
      sizes: Array.from(sizes).sort(),
    };
  }, [species]);

  const filteredSpecies = useMemo(() => {
    if (!species) return [];

    return species.filter(s => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!s.name.toLowerCase().includes(searchLower) && 
            !s.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (filters.types.length > 0 && !filters.types.includes(s.type)) {
        return false;
      }

      if (filters.sizes.length > 0 && !s.sizes?.some(sz => filters.sizes.includes(sz))) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const col = sortState.col;
      
      // Custom size ordering
      if (col === 'sizes') {
        const sizeOrder = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
        const getMinSizeIndex = (sizes: string[] | undefined) => {
          if (!sizes || sizes.length === 0) return 999;
          return Math.min(...sizes.map(s => {
            const idx = sizeOrder.indexOf(s);
            return idx >= 0 ? idx : 999;
          }));
        };
        const aIdx = getMinSizeIndex(a.sizes);
        const bIdx = getMinSizeIndex(b.sizes);
        return sortState.dir * (aIdx - bIdx);
      }
      
      const aVal = a[col as keyof Species];
      const bVal = b[col as keyof Species];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortState.dir * aVal.localeCompare(bVal);
      }
      return 0;
    });
  }, [species, filters, sortState]);

  const handleSort = useCallback((col: string) => {
    setSortState(prev => ({
      col,
      dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : 1,
    }));
  }, []);

  if (error) return <ErrorState message="Failed to load species" />;

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChipSelect
            label="Type"
            placeholder="Choose type"
            options={filterOptions.types.map(t => ({ value: t, label: t }))}
            selectedValues={filters.types}
            onSelect={(v) => setFilters(f => ({ ...f, types: [...f.types, v] }))}
            onRemove={(v) => setFilters(f => ({ ...f, types: f.types.filter(t => t !== v) }))}
          />

          <ChipSelect
            label="Size"
            placeholder="Choose size"
            options={filterOptions.sizes.map(s => ({ value: s, label: s }))}
            selectedValues={filters.sizes}
            onSelect={(v) => setFilters(f => ({ ...f, sizes: [...f.sizes, v] }))}
            onRemove={(v) => setFilters(f => ({ ...f, sizes: f.sizes.filter(s => s !== v) }))}
          />
        </div>
      </FilterSection>

      {/* Column Headers - note: Species uses custom card, not GridListRow */}
      <div className="hidden lg:grid grid-cols-4 gap-4 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700">
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="TYPE" col="type" sortState={sortState} onSort={handleSort} />
        <SortHeader label="SIZES" col="sizes" sortState={sortState} onSort={handleSort} />
        <span>DESCRIPTION</span>
      </div>

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredSpecies.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No species match your filters.</div>
        ) : (
          filteredSpecies.map(s => (
            <SpeciesCard key={s.id} species={s} allTraits={allTraits || []} skillIdToName={skillIdToName} />
          ))
        )}
      </div>
    </div>
  );
}

function SpeciesCard({ species, allTraits, skillIdToName }: { species: Species; allTraits: Trait[]; skillIdToName: Map<string, string> }) {
  const [expanded, setExpanded] = useState(false);
  
  // Resolve trait IDs to full trait objects
  const speciesTraits = useMemo(() => 
    resolveTraitIds(species.species_traits || [], allTraits),
    [species.species_traits, allTraits]
  );
  const ancestryTraits = useMemo(() => 
    resolveTraitIds(species.ancestry_traits || [], allTraits),
    [species.ancestry_traits, allTraits]
  );
  const flaws = useMemo(() => 
    resolveTraitIds(species.flaws || [], allTraits),
    [species.flaws, allTraits]
  );
  const characteristics = useMemo(() => 
    resolveTraitIds(species.characteristics || [], allTraits),
    [species.characteristics, allTraits]
  );
  
  // Resolve skill IDs to names
  const speciesSkillNames = useMemo(() => {
    if (!species.skills?.length) return [];
    return species.skills.map(skillId => skillIdToName.get(String(skillId)) || String(skillId));
  }, [species.skills, skillIdToName]);

  return (
    <div className="bg-surface">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 px-4 py-3 text-left hover:bg-surface-alt transition-colors"
      >
        <div className="font-medium text-text-primary">{species.name}</div>
        <div className="text-text-secondary">{species.type || '-'}</div>
        <div className="text-text-secondary hidden lg:block">{species.sizes?.join(', ') || '-'}</div>
        <div className="hidden lg:flex items-center justify-between">
          <span className="text-text-secondary truncate">{species.description?.substring(0, 50)}...</span>
          <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform flex-shrink-0', expanded && 'rotate-180')} />
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border bg-surface-alt space-y-4">
          {species.description && (
            <p className="text-text-secondary">{species.description}</p>
          )}
          
          {/* Stats Section - unified format including skills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {species.ave_height && (
              <div><span className="font-medium">Avg Height:</span> {species.ave_height} cm</div>
            )}
            {species.ave_weight && (
              <div><span className="font-medium">Avg Weight:</span> {species.ave_weight} kg</div>
            )}
            {species.languages?.length > 0 && (
              <div><span className="font-medium">Languages:</span> {species.languages.join(', ')}</div>
            )}
            {speciesSkillNames.length > 0 && (
              <div><span className="font-medium">Skills:</span> {speciesSkillNames.join(', ')}</div>
            )}
          </div>

          {speciesTraits.length > 0 && (
            <div>
              <h4 className="font-medium text-text-primary mb-2">Species Traits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {speciesTraits.map(trait => (
                  <div key={trait.id} className="p-2 bg-info-50 border border-info-200 rounded">
                    <span className="font-medium text-info-800">{trait.name}</span>
                    {trait.description && (
                      <p className="text-sm text-info-700 mt-1">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ancestryTraits.length > 0 && (
            <div>
              <h4 className="font-medium text-text-primary mb-2">Ancestry Traits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {ancestryTraits.map(trait => (
                  <div key={trait.id} className="p-2 bg-success-50 border border-success-200 rounded">
                    <span className="font-medium text-success-800">{trait.name}</span>
                    {trait.description && (
                      <p className="text-sm text-success-700 mt-1">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {flaws.length > 0 && (
            <div>
              <h4 className="font-medium text-text-primary mb-2">Flaws</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {flaws.map(trait => (
                  <div key={trait.id} className="p-2 bg-danger-50 border border-danger-200 rounded">
                    <span className="font-medium text-danger-800">{trait.name}</span>
                    {trait.description && (
                      <p className="text-sm text-danger-700 mt-1">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {characteristics.length > 0 && (
            <div>
              <h4 className="font-medium text-text-primary mb-2">Characteristics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {characteristics.map(trait => (
                  <div key={trait.id} className="p-2 bg-power-light border border-power-border rounded">
                    <span className="font-medium text-power-text">{trait.name}</span>
                    {trait.description && (
                      <p className="text-sm text-power-text/80 mt-1">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// EQUIPMENT TAB
// =============================================================================

interface Equipment {
  id: string;
  name: string;
  description?: string;
  category?: string;
  gold_cost?: number;
  currency?: number;
  weight?: number;
  rarity?: string;
  damage?: string;
  armor_value?: number;
  properties?: string[];
}

interface EquipmentFilters {
  search: string;
  categoryFilter: string;
  rarityFilter: string;
}

function EquipmentTab() {
  const { data: equipment, isLoading, error } = useEquipment();
  const { data: propertiesDb = [] } = useItemProperties();
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  const [filters, setFilters] = useState<EquipmentFilters>({
    search: '',
    categoryFilter: '',
    rarityFilter: '',
  });

  const filterOptions = useMemo(() => {
    if (!equipment) return { categories: [], rarities: [] };
    const categories = new Set<string>();
    const rarities = new Set<string>();
    equipment.forEach(e => {
      if (e.category) categories.add(e.category);
      if (e.rarity) rarities.add(e.rarity);
    });
    return { 
      categories: Array.from(categories).sort(), 
      rarities: Array.from(rarities).sort() 
    };
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    if (!equipment) return [];

    return equipment.filter(e => {
      if (filters.search && !e.name.toLowerCase().includes(filters.search.toLowerCase()) && 
          !e.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.categoryFilter && e.category !== filters.categoryFilter) return false;
      if (filters.rarityFilter && e.rarity !== filters.rarityFilter) return false;
      return true;
    }).sort((a, b) => {
      const { col, dir } = sortState;
      if (col === 'name') return dir * a.name.localeCompare(b.name);
      if (col === 'category') return dir * (a.category || '').localeCompare(b.category || '');
      if (col === 'cost') return dir * ((a.currency ?? a.gold_cost ?? 0) - (b.currency ?? b.gold_cost ?? 0));
      if (col === 'rarity') return dir * (a.rarity || '').localeCompare(b.rarity || '');
      return 0;
    });
  }, [equipment, filters, sortState]);

  const handleSort = useCallback((col: string) => {
    setSortState(prev => ({
      col,
      dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : 1,
    }));
  }, []);

  if (error) return <ErrorState message="Failed to load equipment" />;

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={filters.search} onChange={(v) => setFilters(f => ({ ...f, search: v }))} placeholder="Search equipment..." />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectFilter
            label="Category"
            value={filters.categoryFilter}
            options={filterOptions.categories.map(c => ({ value: c, label: c }))}
            onChange={(v) => setFilters(f => ({ ...f, categoryFilter: v }))}
            placeholder="All Categories"
          />
          <SelectFilter
            label="Rarity"
            value={filters.rarityFilter}
            options={filterOptions.rarities.map(r => ({ value: r, label: r }))}
            onChange={(v) => setFilters(f => ({ ...f, rarityFilter: v }))}
            placeholder="All Rarities"
          />
        </div>
      </FilterSection>

      {/* Header Row - aligned with GridListRow grid */}
      <div 
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: EQUIPMENT_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="CATEGORY" col="category" sortState={sortState} onSort={handleSort} />
        <SortHeader label="COST" col="cost" sortState={sortState} onSort={handleSort} />
        <SortHeader label="RARITY" col="rarity" sortState={sortState} onSort={handleSort} />
      </div>
        
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredEquipment.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No equipment found.</div>
        ) : (
          filteredEquipment.map(item => (
            <EquipmentCard key={item.id} item={item as Equipment} propertiesDb={propertiesDb} />
          ))
        )}
      </div>
    </div>
  );
}

// Grid columns for equipment list
const EQUIPMENT_GRID_COLUMNS = '1.5fr 1fr 0.8fr 1fr 40px';

function EquipmentCard({ item, propertiesDb = [] }: { item: Equipment; propertiesDb?: ItemProperty[] }) {
  const cost = item.currency ?? item.gold_cost ?? 0;
  
  // Enrich property strings with full data from RTDB
  const propertyChips = useMemo(() => {
    if (!item.properties || item.properties.length === 0) return [];
    return item.properties.map(propName => {
      const match = propertiesDb.find(p => p.name.toLowerCase() === propName.toLowerCase());
      return { 
        name: match?.name || propName, 
        description: match?.description,
        category: 'default' as const,
      };
    });
  }, [item.properties, propertiesDb]);

  // Build additional info for expanded view
  const statsContent = (
    <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
      {item.damage && <span><strong>Damage:</strong> {formatDamageDisplay(item.damage)}</span>}
      {item.armor_value !== undefined && <span><strong>Armor:</strong> {item.armor_value}</span>}
      {item.weight !== undefined && <span><strong>Weight:</strong> {item.weight} kg</span>}
    </div>
  );

  const hasStats = item.damage || item.armor_value !== undefined || item.weight !== undefined;

  return (
    <GridListRow
      id={item.id}
      name={item.name}
      description={item.description}
      gridColumns={EQUIPMENT_GRID_COLUMNS}
      columns={[
        { key: 'Category', value: item.category || '-' },
        { key: 'Cost', value: cost > 0 ? `${cost}c` : '-', highlight: true },
        { key: 'Rarity', value: item.rarity || '-' },
      ]}
      chips={propertyChips}
      chipsLabel="Properties"
      requirements={hasStats ? statsContent : undefined}
    />
  );
}

// =============================================================================
// PROPERTIES TAB
// =============================================================================

interface PropertyFilters {
  search: string;
  typeFilter: string;
}

function PropertiesTab() {
  const { data: properties, isLoading, error } = useItemProperties();
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  const [filters, setFilters] = useState<PropertyFilters>({
    search: '',
    typeFilter: '',
  });

  const typeOptions = useMemo(() => {
    if (!properties) return [];
    const types = new Set<string>();
    properties.forEach(p => p.type && types.add(p.type));
    return Array.from(types).sort();
  }, [properties]);

  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    return properties.filter(p => {
      if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase()) && 
          !p.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.typeFilter && p.type !== filters.typeFilter) return false;
      return true;
    }).sort((a, b) => {
      const { col, dir } = sortState;
      if (col === 'name') return dir * a.name.localeCompare(b.name);
      if (col === 'type') return dir * (a.type || 'General').localeCompare(b.type || 'General');
      if (col === 'ip') return dir * ((a.base_ip ?? 0) - (b.base_ip ?? 0));
      if (col === 'tp') return dir * ((a.base_tp ?? a.tp_cost ?? 0) - (b.base_tp ?? b.tp_cost ?? 0));
      if (col === 'cost') return dir * ((a.base_c ?? a.gold_cost ?? 0) - (b.base_c ?? b.gold_cost ?? 0));
      return 0;
    });
  }, [properties, filters, sortState]);

  const handleSort = useCallback((col: string) => {
    setSortState(prev => ({
      col,
      dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : 1,
    }));
  }, []);

  if (error) return <ErrorState message="Failed to load properties" />;

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={filters.search} onChange={(v) => setFilters(f => ({ ...f, search: v }))} placeholder="Search properties..." />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectFilter
            label="Type"
            value={filters.typeFilter}
            options={typeOptions.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
            onChange={(v) => setFilters(f => ({ ...f, typeFilter: v }))}
            placeholder="All Types"
          />
        </div>
      </FilterSection>

      {/* Header Row - aligned with GridListRow grid */}
      <div 
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: PROPERTY_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="TYPE" col="type" sortState={sortState} onSort={handleSort} />
        <SortHeader label="ITEM PTS" col="ip" sortState={sortState} onSort={handleSort} />
        <SortHeader label="TP" col="tp" sortState={sortState} onSort={handleSort} />
        <SortHeader label="COST MULT" col="cost" sortState={sortState} onSort={handleSort} />
      </div>
        
      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredProperties.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No properties found.</div>
        ) : (
          filteredProperties.map(prop => (
            <PropertyCard key={prop.id} property={prop} />
          ))
        )}
      </div>
    </div>
  );
}

// Grid columns for property list
const PROPERTY_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr 0.8fr 40px';

function PropertyCard({ property }: { property: ItemProperty }) {
  const ip = property.base_ip ?? 0;
  const tp = property.base_tp ?? property.tp_cost ?? 0;
  const cost = property.base_c ?? property.gold_cost ?? 0;

  // Build option info for expanded view if present
  const optionContent = property.op_1_desc ? (
    <div className="mt-3 p-2 bg-surface-alt rounded text-sm">
      <strong>Option:</strong> {property.op_1_desc}
      {(property.op_1_ip !== undefined || property.op_1_tp !== undefined || property.op_1_c !== undefined) && (
        <span className="text-text-muted ml-2">
          ({property.op_1_ip !== undefined && property.op_1_ip !== 0 && `+${property.op_1_ip} IP`}
          {property.op_1_tp !== undefined && property.op_1_tp !== 0 && ` +${property.op_1_tp} TP`}
          {property.op_1_c !== undefined && property.op_1_c !== 0 && ` ×${property.op_1_c}`})
        </span>
      )}
    </div>
  ) : undefined;

  return (
    <GridListRow
      id={property.id}
      name={property.name}
      description={property.description}
      gridColumns={PROPERTY_GRID_COLUMNS}
      columns={[
        { key: 'Type', value: property.type || 'General' },
        { key: 'IP', value: ip > 0 ? ip : '-', className: 'text-blue-600' },
        { key: 'TP', value: tp > 0 ? tp : '-', className: 'text-tp' },
        { key: 'Cost', value: cost > 0 ? `×${cost}` : '-', highlight: true },
      ]}
      expandedContent={optionContent}
    />
  );
}

// =============================================================================
// PARTS TAB
// =============================================================================

interface PartFilters {
  search: string;
  categoryFilter: string;
  typeFilter: 'all' | 'power' | 'technique';
  mechanicMode: 'all' | 'only' | 'hide';
}

function PartsTab() {
  const { data: parts, isLoading, error } = useParts();
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  const [filters, setFilters] = useState<PartFilters>({
    search: '',
    categoryFilter: '',
    typeFilter: 'all',
    mechanicMode: 'hide', // Default to hide mechanics
  });

  const filterOptions = useMemo(() => {
    if (!parts) return { categories: [] };
    const categories = new Set<string>();
    parts.forEach(p => {
      if (p.category) categories.add(p.category);
    });
    return {
      categories: Array.from(categories).sort(),
    };
  }, [parts]);

  const filteredParts = useMemo(() => {
    if (!parts) return [];

    return parts.filter(p => {
      if (filters.search && !p.name.toLowerCase().includes(filters.search.toLowerCase()) && 
          !p.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.categoryFilter && p.category !== filters.categoryFilter) return false;
      
      // Type filter (Power/Technique)
      if (filters.typeFilter !== 'all' && p.type !== filters.typeFilter) return false;
      
      // Mechanic filter
      if (filters.mechanicMode === 'only' && !p.mechanic) return false;
      if (filters.mechanicMode === 'hide' && p.mechanic) return false;
      
      return true;
    }).sort((a, b) => {
      if (sortState.col === 'name') return sortState.dir * a.name.localeCompare(b.name);
      if (sortState.col === 'category') return sortState.dir * (a.category || '').localeCompare(b.category || '');
      return 0;
    });
  }, [parts, filters, sortState]);

  const handleSort = useCallback((col: string) => {
    setSortState(prev => ({
      col,
      dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : 1,
    }));
  }, []);

  if (error) return <ErrorState message="Failed to load parts" />;

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={filters.search} onChange={(v) => setFilters(f => ({ ...f, search: v }))} placeholder="Search parts..." />
      </div>

      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SelectFilter
            label="Category"
            value={filters.categoryFilter}
            options={filterOptions.categories.map(c => ({ value: c, label: c }))}
            onChange={(v) => setFilters(f => ({ ...f, categoryFilter: v }))}
            placeholder="All Categories"
          />
          
          <SelectFilter
            label="Type"
            value={filters.typeFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'power', label: 'Power' },
              { value: 'technique', label: 'Technique' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, typeFilter: v as 'all' | 'power' | 'technique' }))}
            placeholder="All"
          />
          
          <SelectFilter
            label="Mechanics"
            value={filters.mechanicMode}
            options={[
              { value: 'all', label: 'All Parts' },
              { value: 'only', label: 'Only Mechanics' },
              { value: 'hide', label: 'Hide Mechanics' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, mechanicMode: v as 'all' | 'only' | 'hide' }))}
            placeholder="Hide Mechanics"
          />
        </div>
      </FilterSection>

      {/* Header Row - aligned with GridListRow grid */}
      <div 
        className="hidden lg:grid gap-2 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
        style={{ gridTemplateColumns: PART_GRID_COLUMNS }}
      >
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="CATEGORY" col="category" sortState={sortState} onSort={handleSort} />
        <span>ENERGY</span>
        <span>TP</span>
      </div>

      <div className="flex flex-col gap-1 mt-2">
        {isLoading ? (
          <LoadingState />
        ) : filteredParts.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No parts found.</div>
        ) : (
          filteredParts.map(part => (
            <PartCard key={part.id} part={part} />
          ))
        )}
      </div>
    </div>
  );
}

// Grid columns for parts list
const PART_GRID_COLUMNS = '1.5fr 1fr 0.8fr 0.8fr 40px';

// Format energy cost - handle percentage parts
function formatEnergyCost(en: number | undefined, isPercentage: boolean | undefined): string {
  if (en === undefined || en === 0) return '-';
  if (isPercentage) {
    // Convert multiplier to percentage (1.25 = "+25%", 0.875 = "-12.5%")
    const percentChange = (en - 1) * 100;
    const sign = percentChange >= 0 ? '+' : '';
    return `${sign}${percentChange.toFixed(percentChange % 1 === 0 ? 0 : 1)}%`;
  }
  return String(en);
}

function PartCard({ part }: { part: ReturnType<typeof useParts>['data'] extends (infer T)[] | undefined ? T : never }) {
  // Build badges array
  const badges: Array<{ label: string; color?: 'blue' | 'gray' | 'green' | 'purple' | 'red' | 'amber' }> = [];
  if (part.mechanic) badges.push({ label: 'Mechanic', color: 'amber' });

  // Build chips for expanded view
  const typeChips: ChipData[] = [
    {
      name: part.type === 'power' ? 'Power' : 'Technique',
      category: part.type === 'power' ? 'archetype' : 'skill',
    },
  ];
  if (part.mechanic) typeChips.push({ name: 'Mechanic', category: 'default' });
  if (part.percentage) typeChips.push({ name: 'Percentage Cost', category: 'archetype' });

  // Build options content for expanded view
  const hasOptions = part.op_1_desc || part.op_2_desc || part.op_3_desc;
  const optionsContent = hasOptions ? (
    <div className="space-y-2 text-sm mt-3">
      <div className="font-medium text-text-secondary">Options:</div>
      {part.op_1_desc && (
        <div className="pl-4 text-text-muted">
          1. {part.op_1_desc} 
          {part.op_1_en !== undefined && part.op_1_en !== 0 && ` (Energy: ${formatEnergyCost(part.op_1_en, part.percentage)})`}
          {part.op_1_tp !== undefined && part.op_1_tp !== 0 && ` (TP: ${part.op_1_tp})`}
        </div>
      )}
      {part.op_2_desc && (
        <div className="pl-4 text-text-muted">
          2. {part.op_2_desc}
          {part.op_2_en !== undefined && part.op_2_en !== 0 && ` (Energy: ${formatEnergyCost(part.op_2_en, part.percentage)})`}
          {part.op_2_tp !== undefined && part.op_2_tp !== 0 && ` (TP: ${part.op_2_tp})`}
        </div>
      )}
      {part.op_3_desc && (
        <div className="pl-4 text-text-muted">
          3. {part.op_3_desc}
          {part.op_3_en !== undefined && part.op_3_en !== 0 && ` (Energy: ${formatEnergyCost(part.op_3_en, part.percentage)})`}
          {part.op_3_tp !== undefined && part.op_3_tp !== 0 && ` (TP: ${part.op_3_tp})`}
        </div>
      )}
    </div>
  ) : undefined;

  return (
    <GridListRow
      id={part.id}
      name={part.name}
      description={part.description}
      gridColumns={PART_GRID_COLUMNS}
      columns={[
        { key: 'Category', value: part.category || '-' },
        { key: 'Energy', value: formatEnergyCost(part.base_en, part.percentage), className: 'text-blue-600' },
        { key: 'TP', value: part.base_tp ? part.base_tp : '-', className: 'text-tp' },
      ]}
      badges={badges}
      chips={typeChips}
      chipsLabel="Type"
      expandedContent={optionsContent}
    />
  );
}

