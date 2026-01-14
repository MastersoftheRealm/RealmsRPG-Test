/**
 * Codex Page - Full Implementation
 * =================================
 * Complete game reference matching vanilla site functionality.
 * Features all filters: level req, ability req, categories, tags with Any/All, feat types, state feats.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn, formatDamageDisplay } from '@/lib/utils';
import {
  ChipSelect,
  AbilityRequirementFilter,
  TagFilter,
  CheckboxFilter,
  SelectFilter,
  FilterSection,
  type AbilityRequirement,
} from '@/components/codex';
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Codex</h1>
        <p className="text-gray-600">
          Complete reference for the Realms RPG system.
        </p>
      </div>

      {/* Tab Navigation - Matches vanilla site */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 bg-primary-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.labelMobile || tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'feats' && <FeatsTab />}
      {activeTab === 'skills' && <SkillsTab />}
      {activeTab === 'species' && <SpeciesTab />}
      {activeTab === 'equipment' && <EquipmentTab />}
      {activeTab === 'properties' && <PropertiesTab />}
      {activeTab === 'parts' && <PartsTab />}
    </div>
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
  showArchetype: boolean;
  showCharacter: boolean;
  stateFeatMode: 'show' | 'only' | 'hide';
}

function FeatsTab() {
  const { data: feats, isLoading, error } = useRTDBFeats();
  const [showFilters, setShowFilters] = useState(true);
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  
  const [filters, setFilters] = useState<FeatFilters>({
    search: '',
    maxLevel: null,
    abilityRequirements: [],
    categories: [],
    abilities: [],
    tags: [],
    tagMode: 'all',
    showArchetype: true,
    showCharacter: true,
    stateFeatMode: 'show',
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

      // Feat type filter (Archetype/Character)
      if (!filters.showArchetype && !f.char_feat) return false;
      if (!filters.showCharacter && f.char_feat) return false;

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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
            placeholder="Search names, tags, descriptions..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {filters.search && (
            <button
              onClick={() => setFilters(f => ({ ...f, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
      >
        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      {/* Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Required Level */}
          {/* Required Level - Input filter */}
          <div className="filter-group">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Required Level
            </label>
            <input
              type="number"
              min={0}
              value={filters.maxLevel ?? ''}
              onChange={(e) => setFilters(f => ({ 
                ...f, 
                maxLevel: e.target.value ? parseInt(e.target.value) : null 
              }))}
              placeholder="No limit"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">Hide feats requiring higher levels</p>
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
          <CheckboxFilter
            label="Feat Type"
            options={[
              { id: 'archetype', label: 'Archetype', checked: filters.showArchetype },
              { id: 'character', label: 'Character', checked: filters.showCharacter },
            ]}
            onChange={(id, checked) => {
              if (id === 'archetype') setFilters(f => ({ ...f, showArchetype: checked }));
              if (id === 'character') setFilters(f => ({ ...f, showCharacter: checked }));
            }}
          />

          {/* State Feats */}
          <SelectFilter
            label="State Feats"
            value={filters.stateFeatMode}
            options={[
              { value: 'show', label: 'Include State Feats' },
              { value: 'only', label: 'Only State Feats' },
              { value: 'hide', label: 'Hide State Feats' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, stateFeatMode: v as 'show' | 'only' | 'hide' }))}
            placeholder="All Feats"
          />
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-500 mb-4">
        {isLoading ? 'Loading...' : `${filteredFeats.length} feats found`}
      </div>

      {/* Column Headers */}
      <div className="hidden lg:grid grid-cols-6 gap-4 px-4 py-2 bg-gray-100 rounded-t-lg font-medium text-sm text-gray-700">
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="REQ. LEVEL" col="lvl_req" sortState={sortState} onSort={handleSort} />
        <SortHeader label="CATEGORY" col="category" sortState={sortState} onSort={handleSort} />
        <SortHeader label="ABILITY" col="ability" sortState={sortState} onSort={handleSort} />
        <SortHeader label="RECOVERY" col="rec_period" sortState={sortState} onSort={handleSort} />
        <SortHeader label="USES" col="uses_per_rec" sortState={sortState} onSort={handleSort} />
      </div>

      {/* Feat List */}
      <div className="divide-y divide-gray-200 border border-gray-200 rounded-b-lg lg:rounded-t-none rounded-lg">
        {isLoading ? (
          <LoadingState />
        ) : filteredFeats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No feats match your filters.</div>
        ) : (
          filteredFeats.map(feat => (
            <FeatCard key={feat.id} feat={feat} />
          ))
        )}
      </div>
    </div>
  );
}

function FeatCard({ feat }: { feat: Feat }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-2 lg:grid-cols-6 gap-2 lg:gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="font-medium text-gray-900">{feat.name}</div>
        <div className="text-gray-600 text-sm lg:text-base">{feat.lvl_req || '-'}</div>
        <div className="text-gray-600 text-sm lg:text-base hidden lg:block">{feat.category || '-'}</div>
        <div className="text-gray-600 text-sm lg:text-base hidden lg:block">{feat.ability || '-'}</div>
        <div className="text-gray-600 text-sm lg:text-base hidden lg:block">-</div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm lg:text-base">{feat.uses_per_rec || '-'}</span>
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
          {feat.description && (
            <p className="text-gray-700 mb-3">{feat.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2 mb-3">
            {feat.char_feat && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Character Feat</span>
            )}
            {feat.state_feat && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">State Feat</span>
            )}
            {feat.category && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">{feat.category}</span>
            )}
          </div>

          {/* Requirements */}
          <div className="space-y-1 text-sm">
            {feat.ability_req?.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Ability Requirements:</span>{' '}
                <span className="text-gray-600">
                  {feat.ability_req.map((a, i) => {
                    const val = feat.abil_req_val?.[i];
                    return `${a}${typeof val === 'number' ? ` ${val}` : ''}`;
                  }).join(', ')}
                </span>
              </div>
            )}
            {feat.skill_req?.length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Skill Requirements:</span>{' '}
                <span className="text-gray-600">
                  {feat.skill_req.map((s, i) => {
                    const val = feat.skill_req_val?.[i];
                    return `${s}${typeof val === 'number' ? ` ${val}` : ''}`;
                  }).join(', ')}
                </span>
              </div>
            )}
            {feat.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {feat.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SKILLS TAB
// =============================================================================

interface SkillFilters {
  search: string;
  abilities: string[];
  baseSkill: string;
  showSubSkills: boolean;
  subSkillsOnly: boolean;
}

function SkillsTab() {
  const { data: skills, isLoading, error } = useRTDBSkills();
  const [showFilters, setShowFilters] = useState(true);
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  
  const [filters, setFilters] = useState<SkillFilters>({
    search: '',
    abilities: [],
    baseSkill: '',
    showSubSkills: true,
    subSkillsOnly: false,
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
      if (s.base_skill && typeof s.base_skill === 'string') baseSkills.add(s.base_skill);
    });

    return {
      abilities: Array.from(abilities).sort(),
      baseSkills: Array.from(baseSkills).sort(),
    };
  }, [skills]);

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
        const hasThisBaseSkill = s.base_skill === filters.baseSkill;
        if (!isThisBaseSkill && !hasThisBaseSkill) return false;
      }

      // Sub-skill filtering logic (matching vanilla site)
      const isSubSkill = Boolean(s.base_skill);
      
      // If subSkillsOnly is true, only show skills that have a base_skill
      if (filters.subSkillsOnly && !isSubSkill) return false;
      
      // If showSubSkills is false, hide skills that have a base_skill
      if (!filters.showSubSkills && isSubSkill) return false;

      return true;
    }).sort((a, b) => {
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

      {/* Filters Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
      >
        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
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

          <CheckboxFilter
            label="Skill Type"
            options={[
              { id: 'subSkills', label: 'Include Sub-Skills', checked: filters.showSubSkills },
              { id: 'subSkillsOnly', label: 'Sub-Skills Only', checked: filters.subSkillsOnly },
            ]}
            onChange={(id, checked) => {
              if (id === 'subSkills') setFilters(f => ({ ...f, showSubSkills: checked }));
              if (id === 'subSkillsOnly') setFilters(f => ({ ...f, subSkillsOnly: checked }));
            }}
          />
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-500 mb-4">
        {isLoading ? 'Loading...' : `${filteredSkills.length} skills found`}
      </div>

      {/* Column Headers */}
      <div className="hidden lg:grid grid-cols-3 gap-4 px-4 py-2 bg-gray-100 rounded-t-lg font-medium text-sm text-gray-700">
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="ABILITIES" col="ability" sortState={sortState} onSort={handleSort} />
        <SortHeader label="BASE SKILL" col="base_skill" sortState={sortState} onSort={handleSort} />
      </div>

      {/* Skill List */}
      <div className="divide-y divide-gray-200 border border-gray-200 rounded-b-lg lg:rounded-t-none rounded-lg">
        {isLoading ? (
          <LoadingState />
        ) : filteredSkills.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No skills match your filters.</div>
        ) : (
          filteredSkills.map(skill => (
            <SkillCard key={skill.id} skill={skill} />
          ))
        )}
      </div>
    </div>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  const [expanded, setExpanded] = useState(false);
  const isSubSkill = Boolean(skill.base_skill);

  return (
    <div className="bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isSubSkill && <span className="text-xs text-gray-400">↳</span>}
          <span className={cn('font-medium', isSubSkill ? 'text-gray-700' : 'text-gray-900')}>{skill.name}</span>
        </div>
        <div className="text-gray-600 capitalize">{skill.ability || '-'}</div>
        <div className="hidden lg:flex items-center justify-between">
          <span className={cn('text-gray-600', isSubSkill && 'text-primary-600')}>
            {skill.base_skill || '-'}
          </span>
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>
      
      {expanded && skill.description && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
          <p className="text-gray-700">{skill.description}</p>
          {skill.base_skill && (
            <p className="text-sm text-primary-600 mt-2">
              Sub-skill of: <strong>{skill.base_skill}</strong>
            </p>
          )}
        </div>
      )}
    </div>
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
  const [showFilters, setShowFilters] = useState(true);
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });
  
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

      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
      >
        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
      )}

      <div className="text-sm text-gray-500 mb-4">
        {isLoading ? 'Loading...' : `${filteredSpecies.length} species found`}
      </div>

      <div className="hidden lg:grid grid-cols-4 gap-4 px-4 py-2 bg-gray-100 rounded-t-lg font-medium text-sm text-gray-700">
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="TYPE" col="type" sortState={sortState} onSort={handleSort} />
        <SortHeader label="SIZES" col="sizes" sortState={sortState} onSort={handleSort} />
        <div>DESCRIPTION</div>
      </div>

      <div className="divide-y divide-gray-200 border border-gray-200 rounded-b-lg lg:rounded-t-none rounded-lg">
        {isLoading ? (
          <LoadingState />
        ) : filteredSpecies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No species match your filters.</div>
        ) : (
          filteredSpecies.map(s => (
            <SpeciesCard key={s.id} species={s} allTraits={allTraits || []} />
          ))
        )}
      </div>
    </div>
  );
}

function SpeciesCard({ species, allTraits }: { species: Species; allTraits: Trait[] }) {
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

  return (
    <div className="bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="font-medium text-gray-900">{species.name}</div>
        <div className="text-gray-600">{species.type || '-'}</div>
        <div className="text-gray-600 hidden lg:block">{species.sizes?.join(', ') || '-'}</div>
        <div className="hidden lg:flex items-center justify-between">
          <span className="text-gray-600 truncate">{species.description?.substring(0, 50)}...</span>
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform flex-shrink-0', expanded && 'rotate-180')} />
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50 space-y-4">
          {species.description && (
            <p className="text-gray-700">{species.description}</p>
          )}
          
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
          </div>

          {speciesTraits.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Species Traits</h4>
              <div className="space-y-2">
                {speciesTraits.map(trait => (
                  <div key={trait.id} className="p-2 bg-blue-50 border border-blue-200 rounded">
                    <span className="font-medium text-blue-800">{trait.name}</span>
                    {trait.description && (
                      <p className="text-sm text-blue-700 mt-1">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ancestryTraits.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Ancestry Traits</h4>
              <div className="space-y-2">
                {ancestryTraits.map(trait => (
                  <div key={trait.id} className="p-2 bg-green-50 border border-green-200 rounded">
                    <span className="font-medium text-green-800">{trait.name}</span>
                    {trait.description && (
                      <p className="text-sm text-green-700 mt-1">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {flaws.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Flaws</h4>
              <div className="space-y-2">
                {flaws.map(trait => (
                  <div key={trait.id} className="p-2 bg-red-50 border border-red-200 rounded">
                    <span className="font-medium text-red-800">{trait.name}</span>
                    {trait.description && (
                      <p className="text-sm text-red-700 mt-1">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {characteristics.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Characteristics</h4>
              <div className="space-y-2">
                {characteristics.map(trait => (
                  <div key={trait.id} className="p-2 bg-purple-50 border border-purple-200 rounded">
                    <span className="font-medium text-purple-800">{trait.name}</span>
                    {trait.description && (
                      <p className="text-sm text-purple-700 mt-1">{trait.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {species.skills?.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {species.skills.map(skill => (
                  <span key={skill} className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm">{skill}</span>
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
  type?: string;
  subtype?: string;
  gold_cost?: number;
  currency?: number;
  weight?: number;
  rarity?: string;
}

function EquipmentTab() {
  const { data: equipment, isLoading, error } = useEquipment();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [subtypeFilter, setSubtypeFilter] = useState('');
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });

  const filterOptions = useMemo(() => {
    if (!equipment) return { types: [], subtypes: [] };
    const types = new Set<string>();
    const subtypes = new Set<string>();
    equipment.forEach(e => {
      if (e.type) types.add(e.type);
      if (e.subtype) subtypes.add(e.subtype);
    });
    return { types: Array.from(types).sort(), subtypes: Array.from(subtypes).sort() };
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    if (!equipment) return [];

    return equipment.filter(e => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && 
          !e.description?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (typeFilter && e.type !== typeFilter) return false;
      if (subtypeFilter && e.subtype !== subtypeFilter) return false;
      return true;
    }).sort((a, b) => {
      const { col, dir } = sortState;
      if (col === 'name') return dir * a.name.localeCompare(b.name);
      if (col === 'type') return dir * (a.type || '').localeCompare(b.type || '');
      if (col === 'subtype') return dir * (a.subtype || '').localeCompare(b.subtype || '');
      if (col === 'cost') return dir * ((a.currency ?? a.gold_cost ?? 0) - (b.currency ?? b.gold_cost ?? 0));
      if (col === 'rarity') return dir * (a.rarity || '').localeCompare(b.rarity || '');
      return 0;
    });
  }, [equipment, search, typeFilter, subtypeFilter, sortState]);

  const toggleSort = (col: string) => {
    setSortState(prev => prev.col === col ? { col, dir: prev.dir === 1 ? -1 : 1 } : { col, dir: 1 });
  };

  if (error) return <ErrorState message="Failed to load equipment" />;

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search equipment..." />
      </div>

      <FilterSection>
        <div className="flex flex-wrap gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">All Types</option>
            {filterOptions.types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={subtypeFilter}
            onChange={(e) => setSubtypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">All Subtypes</option>
            {filterOptions.subtypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </FilterSection>

      <div className="text-sm text-gray-500 mb-4">
        {isLoading ? 'Loading...' : `${filteredEquipment.length} items found`}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-[1fr_100px_100px_80px_80px] gap-2 lg:gap-4 px-4 py-3 bg-gray-100 border-b border-gray-200 text-sm font-medium text-gray-700">
          <button onClick={() => toggleSort('name')} className="text-left hover:text-gray-900 flex items-center gap-1">
            Name {sortState.col === 'name' && (sortState.dir === 1 ? '↑' : '↓')}
          </button>
          <button onClick={() => toggleSort('type')} className="text-left hover:text-gray-900 flex items-center gap-1">
            Type {sortState.col === 'type' && (sortState.dir === 1 ? '↑' : '↓')}
          </button>
          <button onClick={() => toggleSort('subtype')} className="text-left hover:text-gray-900 flex items-center gap-1">
            Subtype {sortState.col === 'subtype' && (sortState.dir === 1 ? '↑' : '↓')}
          </button>
          <button onClick={() => toggleSort('cost')} className="text-left hover:text-gray-900 flex items-center gap-1">
            Cost {sortState.col === 'cost' && (sortState.dir === 1 ? '↑' : '↓')}
          </button>
          <button onClick={() => toggleSort('rarity')} className="text-left hover:text-gray-900 flex items-center gap-1">
            Rarity {sortState.col === 'rarity' && (sortState.dir === 1 ? '↑' : '↓')}
          </button>
        </div>
        
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <LoadingState />
          ) : filteredEquipment.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No equipment found.</div>
          ) : (
            filteredEquipment.map(item => (
              <EquipmentCard key={item.id} item={item as Equipment} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function EquipmentCard({ item }: { item: Equipment }) {
  const [expanded, setExpanded] = useState(false);
  const cost = item.currency ?? item.gold_cost ?? 0;

  return (
    <div className="bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-[1fr_100px_100px_80px_80px] gap-2 lg:gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="font-medium text-gray-900 flex items-center gap-2">
          {item.name}
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform flex-shrink-0', expanded && 'rotate-180')} />
        </div>
        <div className="text-gray-600 capitalize">{item.type || '-'}</div>
        <div className="text-gray-600 capitalize">{item.subtype || '-'}</div>
        <div className="text-amber-600 font-medium">{cost > 0 ? `${cost}c` : '-'}</div>
        <div className="text-purple-600 capitalize">{item.rarity || '-'}</div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
          {item.description && (
            <p className="text-gray-700 mb-2">{item.description}</p>
          )}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {item.damage && <span><strong>Damage:</strong> {formatDamageDisplay(item.damage)}</span>}
            {item.armor_value !== undefined && <span><strong>Armor:</strong> {item.armor_value}</span>}
            {item.weight !== undefined && <span><strong>Weight:</strong> {item.weight} kg</span>}
            {item.properties && item.properties.length > 0 && (
              <span><strong>Properties:</strong> {item.properties.join(', ')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PROPERTIES TAB
// =============================================================================

function PropertiesTab() {
  const { data: properties, isLoading, error } = useItemProperties();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });

  const typeOptions = useMemo(() => {
    if (!properties) return [];
    const types = new Set<string>();
    properties.forEach(p => p.type && types.add(p.type));
    return Array.from(types).sort();
  }, [properties]);

  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    return properties.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && 
          !p.description?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (typeFilter && p.type !== typeFilter) return false;
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
  }, [properties, search, typeFilter, sortState]);

  const toggleSort = (col: string) => {
    setSortState(prev => prev.col === col ? { col, dir: prev.dir === 1 ? -1 : 1 } : { col, dir: 1 });
  };

  if (error) return <ErrorState message="Failed to load properties" />;

  return (
    <div>
      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search properties..." />
      </div>

      <FilterSection>
        <div className="flex gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">All Types</option>
            {typeOptions.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </FilterSection>

      <div className="text-sm text-gray-500 mb-4">
        {isLoading ? 'Loading...' : `${filteredProperties.length} properties found`}
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-[1fr_100px_60px_60px_80px] gap-2 lg:gap-4 px-4 py-3 bg-gray-100 border-b border-gray-200 text-sm font-medium text-gray-700">
          <button onClick={() => toggleSort('name')} className="text-left hover:text-gray-900 flex items-center gap-1">
            Name {sortState.col === 'name' && (sortState.dir === 1 ? '↑' : '↓')}
          </button>
          <button onClick={() => toggleSort('type')} className="text-left hover:text-gray-900 flex items-center gap-1">
            Type {sortState.col === 'type' && (sortState.dir === 1 ? '↑' : '↓')}
          </button>
          <button onClick={() => toggleSort('ip')} className="text-left hover:text-gray-900 flex items-center gap-1">
            IP {sortState.col === 'ip' && (sortState.dir === 1 ? '↑' : '↓')}
          </button>
          <button onClick={() => toggleSort('tp')} className="text-left hover:text-gray-900 flex items-center gap-1">
            TP {sortState.col === 'tp' && (sortState.dir === 1 ? '↑' : '↓')}
          </button>
          <button onClick={() => toggleSort('cost')} className="text-left hover:text-gray-900 flex items-center gap-1">
            Cost {sortState.col === 'cost' && (sortState.dir === 1 ? '↑' : '↓')}
          </button>
        </div>
        
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <LoadingState />
          ) : filteredProperties.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No properties found.</div>
          ) : (
            filteredProperties.map(prop => (
              <PropertyCard key={prop.id} property={prop} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: ItemProperty }) {
  const [expanded, setExpanded] = useState(false);
  const ip = property.base_ip ?? 0;
  const tp = property.base_tp ?? property.tp_cost ?? 0;
  const cost = property.base_c ?? property.gold_cost ?? 0;

  return (
    <div className="bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-[1fr_100px_60px_60px_80px] gap-2 lg:gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="font-medium text-gray-900 flex items-center gap-2">
          {property.name}
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform flex-shrink-0', expanded && 'rotate-180')} />
        </div>
        <div className="text-gray-600 capitalize">{property.type || 'General'}</div>
        <div className="text-blue-600">{ip > 0 ? ip : '-'}</div>
        <div className="text-purple-600">{tp > 0 ? tp : '-'}</div>
        <div className="text-amber-600">{cost > 0 ? `${cost}c` : '-'}</div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
          {property.description && (
            <p className="text-gray-700 mb-3">{property.description}</p>
          )}
          {property.op_1_desc && (
            <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
              <strong>Option:</strong> {property.op_1_desc}
              {(property.op_1_ip !== undefined || property.op_1_tp !== undefined || property.op_1_c !== undefined) && (
                <span className="text-gray-500 ml-2">
                  ({property.op_1_ip !== undefined && `+${property.op_1_ip} IP`}
                  {property.op_1_tp !== undefined && ` +${property.op_1_tp} TP`}
                  {property.op_1_c !== undefined && ` +${property.op_1_c}c`})
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PARTS TAB
// =============================================================================

function PartsTab() {
  const { data: parts, isLoading, error } = useParts();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });

  const filterOptions = useMemo(() => {
    if (!parts) return { categories: [], types: [] };
    const categories = new Set<string>();
    const types = new Set<string>();
    parts.forEach(p => {
      if (p.category) categories.add(p.category);
      if (p.type) types.add(p.type);
    });
    return {
      categories: Array.from(categories).sort(),
      types: Array.from(types).sort(),
    };
  }, [parts]);

  const filteredParts = useMemo(() => {
    if (!parts) return [];

    return parts.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && 
          !p.description?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (categoryFilter && p.category !== categoryFilter) return false;
      if (typeFilter && p.type !== typeFilter) return false;
      return true;
    }).sort((a, b) => {
      if (sortState.col === 'name') return sortState.dir * a.name.localeCompare(b.name);
      if (sortState.col === 'category') return sortState.dir * (a.category || '').localeCompare(b.category || '');
      if (sortState.col === 'type') return sortState.dir * (a.type || '').localeCompare(b.type || '');
      return 0;
    });
  }, [parts, search, categoryFilter, typeFilter, sortState]);

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
        <SearchInput value={search} onChange={setSearch} placeholder="Search parts..." />
      </div>

      <FilterSection>
        <div className="flex gap-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">All Categories</option>
            {filterOptions.categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
          >
            <option value="">All Types</option>
            {filterOptions.types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </FilterSection>

      <div className="text-sm text-gray-500 mb-4">
        {isLoading ? 'Loading...' : `${filteredParts.length} parts found`}
      </div>

      <div className="hidden lg:grid grid-cols-4 gap-4 px-4 py-2 bg-gray-100 rounded-t-lg font-medium text-sm text-gray-700">
        <SortHeader label="NAME" col="name" sortState={sortState} onSort={handleSort} />
        <SortHeader label="CATEGORY" col="category" sortState={sortState} onSort={handleSort} />
        <SortHeader label="TYPE" col="type" sortState={sortState} onSort={handleSort} />
        <div>COST</div>
      </div>

      <div className="divide-y divide-gray-200 border border-gray-200 rounded-b-lg lg:rounded-t-none rounded-lg">
        {isLoading ? (
          <LoadingState />
        ) : filteredParts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No parts found.</div>
        ) : (
          filteredParts.map(part => (
            <PartCard key={part.id} part={part} />
          ))
        )}
      </div>
    </div>
  );
}

function PartCard({ part }: { part: ReturnType<typeof useParts>['data'] extends (infer T)[] | undefined ? T : never }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="font-medium text-gray-900">{part.name}</div>
        <div className="text-gray-600">{part.category || '-'}</div>
        <div className="text-gray-600 hidden lg:block">{part.type || '-'}</div>
        <div className="hidden lg:flex items-center justify-between">
          <span className="text-gray-600">
            {part.base_en ? `EN: ${part.base_en}` : ''} 
            {part.base_tp ? ` TP: ${part.base_tp}` : ''}
          </span>
          <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
          {part.description && <p className="text-gray-700 mb-3">{part.description}</p>}
          
          {part.mechanic && (
            <div className="text-sm mb-2">
              <span className="font-medium text-gray-700">Mechanic:</span>{' '}
              <span className="text-gray-600">{part.mechanic}</span>
            </div>
          )}

          {(part.op_1_desc || part.op_2_desc || part.op_3_desc) && (
            <div className="space-y-2 text-sm">
              <div className="font-medium text-gray-700">Options:</div>
              {part.op_1_desc && (
                <div className="pl-4 text-gray-600">
                  1. {part.op_1_desc} 
                  {part.op_1_en && ` (EN: ${part.op_1_en})`}
                  {part.op_1_tp && ` (TP: ${part.op_1_tp})`}
                </div>
              )}
              {part.op_2_desc && (
                <div className="pl-4 text-gray-600">
                  2. {part.op_2_desc}
                  {part.op_2_en && ` (EN: ${part.op_2_en})`}
                  {part.op_2_tp && ` (TP: ${part.op_2_tp})`}
                </div>
              )}
              {part.op_3_desc && (
                <div className="pl-4 text-gray-600">
                  3. {part.op_3_desc}
                  {part.op_3_en && ` (EN: ${part.op_3_en})`}
                  {part.op_3_tp && ` (TP: ${part.op_3_tp})`}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function SortHeader({ 
  label, 
  col, 
  sortState, 
  onSort 
}: { 
  label: string; 
  col: string; 
  sortState: { col: string; dir: 1 | -1 }; 
  onSort: (col: string) => void;
}) {
  const isActive = sortState.col === col;
  
  return (
    <button
      onClick={() => onSort(col)}
      className="flex items-center gap-1 text-left hover:text-gray-900"
    >
      {label}
      {isActive && (
        sortState.dir === 1 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      )}
    </button>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 mb-4 text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-red-500 font-medium">{message}</p>
      <p className="text-gray-500 text-sm mt-1">Please try again later</p>
    </div>
  );
}
