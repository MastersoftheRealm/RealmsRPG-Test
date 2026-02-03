/**
 * Feats Step - Codex-Style
 * =========================
 * Select character feats with Codex-style filtering and GridListRow cards.
 * Features auto-filters based on character stats to hide unqualified feats.
 * 
 * Feat Limits by Archetype:
 * - Power: 1 archetype feat + 1 character feat
 * - Powered-Martial: 2 archetype feats + 1 character feat
 * - Martial: 3 archetype feats + 1 character feat
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Spinner, Button } from '@/components/ui';
import { 
  GridListRow, 
  SearchInput, 
  SortHeader, 
  type ChipData 
} from '@/components/shared';
import { 
  FilterSection, 
  ChipSelect, 
  SelectFilter 
} from '@/components/codex';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useRTDBFeats, type RTDBFeat } from '@/hooks';
import { getArchetypeFeatLimit } from '@/lib/game/formulas';
import type { ArchetypeCategory } from '@/types';

// Character feats are always 1 at level 1
const CHARACTER_FEAT_LIMIT = 1;

// Grid columns for feat display
const FEAT_GRID_COLUMNS = '1.5fr 0.8fr 1fr 0.8fr 40px';

interface SelectedFeat {
  id: string;
  name: string;
  description?: string;
  type: 'archetype' | 'character';
}

interface FeatFilters {
  search: string;
  categories: string[];
  featType: 'all' | 'archetype' | 'character';
  hideUnqualified: boolean;
  sortCol: string;
  sortDir: 1 | -1;
}

export function FeatsStep() {
  const { draft, nextStep, prevStep, updateDraft } = useCharacterCreatorStore();
  const { data: feats, isLoading } = useRTDBFeats();
  
  const [filters, setFilters] = useState<FeatFilters>({
    search: '',
    categories: [],
    featType: 'all',
    hideUnqualified: true, // Auto-hide unqualified by default
    sortCol: 'name',
    sortDir: 1,
  });

  // Get archetype feat limit based on archetype type
  const archetypeType = (draft.archetype?.type || 'power') as ArchetypeCategory;
  const maxArchetypeFeats = getArchetypeFeatLimit(archetypeType);
  const maxCharacterFeats = CHARACTER_FEAT_LIMIT;
  
  // Separate selected feats by type
  const { selectedArchetypeFeats, selectedCharacterFeats } = useMemo(() => {
    const archFeats: SelectedFeat[] = [];
    const charFeats: SelectedFeat[] = [];
    
    draft.feats?.forEach(f => {
      if (f.type === 'character') {
        charFeats.push(f as SelectedFeat);
      } else {
        archFeats.push(f as SelectedFeat);
      }
    });
    
    return { 
      selectedArchetypeFeats: archFeats, 
      selectedCharacterFeats: charFeats 
    };
  }, [draft.feats]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    if (!feats) return [];
    const cats = new Set<string>();
    feats.forEach(f => f.category && cats.add(f.category));
    return Array.from(cats).sort();
  }, [feats]);

  // Check if character meets feat requirements
  const checkRequirements = useCallback((feat: RTDBFeat): { met: boolean; reason?: string } => {
    const abilities = draft.abilities || {};
    const skills = draft.skills || {};
    
    // Check level requirement
    if (feat.lvl_req > (draft.level || 1)) {
      return { met: false, reason: `Requires level ${feat.lvl_req}` };
    }
    
    // Check ability requirements
    for (let i = 0; i < feat.ability_req.length; i++) {
      const reqAbility = feat.ability_req[i].toLowerCase() as keyof typeof abilities;
      const reqValue = feat.abil_req_val[i] || 0;
      const charValue = abilities[reqAbility] || 0;
      
      if (charValue < reqValue) {
        return { met: false, reason: `Requires ${feat.ability_req[i]} ${reqValue}+` };
      }
    }
    
    // Check skill requirements
    for (let i = 0; i < feat.skill_req.length; i++) {
      const reqSkill = feat.skill_req[i];
      const reqValue = feat.skill_req_val[i] || 1;
      const charValue = skills[reqSkill] || 0;
      
      if (charValue < reqValue) {
        return { met: false, reason: `Requires ${reqSkill} ${reqValue}+` };
      }
    }
    
    // Check martial ability requirement
    if (feat.mart_abil_req && draft.archetype?.mart_abil !== feat.mart_abil_req) {
      return { met: false, reason: `Requires ${feat.mart_abil_req} martial ability` };
    }
    
    return { met: true };
  }, [draft.abilities, draft.skills, draft.level, draft.archetype?.mart_abil]);

  // Filter and sort feats
  const filteredFeats = useMemo(() => {
    if (!feats) return [];
    
    return feats.filter(feat => {
      // Search filter
      if (filters.search) {
        const term = filters.search.toLowerCase();
        const matches = 
          feat.name.toLowerCase().includes(term) ||
          feat.description?.toLowerCase().includes(term) ||
          feat.tags.some(t => t.toLowerCase().includes(term));
        if (!matches) return false;
      }
      
      // Feat type filter
      if (filters.featType === 'archetype' && feat.char_feat) return false;
      if (filters.featType === 'character' && !feat.char_feat) return false;
      
      // Category filter (multi-select)
      if (filters.categories.length > 0 && !filters.categories.includes(feat.category)) {
        return false;
      }
      
      // Hide unqualified filter (auto-filter based on character stats)
      if (filters.hideUnqualified) {
        const reqs = checkRequirements(feat);
        if (!reqs.met) return false;
      }
      
      return true;
    }).sort((a, b) => {
      const col = filters.sortCol as keyof RTDBFeat;
      const aVal = a[col];
      const bVal = b[col];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return filters.sortDir * aVal.localeCompare(bVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return filters.sortDir * (aVal - bVal);
      }
      return 0;
    });
  }, [feats, filters, checkRequirements]);

  // Separate filtered feats into archetype and character
  const { archetypeFeats, characterFeats } = useMemo(() => {
    const arch = filteredFeats.filter(f => !f.char_feat);
    const char = filteredFeats.filter(f => f.char_feat);
    return { archetypeFeats: arch, characterFeats: char };
  }, [filteredFeats]);

  const toggleFeat = useCallback((feat: RTDBFeat, isCharacterFeat: boolean) => {
    const featType = isCharacterFeat ? 'character' : 'archetype';
    const selectedList = isCharacterFeat ? selectedCharacterFeats : selectedArchetypeFeats;
    const maxForType = isCharacterFeat ? maxCharacterFeats : maxArchetypeFeats;
    
    const isSelected = selectedList.some(f => f.id === feat.id);
    
    if (isSelected) {
      // Remove feat
      updateDraft({
        feats: draft.feats?.filter(f => f.id !== feat.id) || []
      });
    } else {
      // Check if at max for this type
      if (selectedList.length >= maxForType) return;
      
      // Add feat
      updateDraft({
        feats: [
          ...(draft.feats || []),
          {
            id: feat.id,
            name: feat.name,
            description: feat.description,
            type: featType,
          }
        ]
      });
    }
  }, [selectedArchetypeFeats, selectedCharacterFeats, maxArchetypeFeats, maxCharacterFeats, draft.feats, updateDraft]);

  const handleSort = useCallback((col: string) => {
    setFilters(prev => ({
      ...prev,
      sortCol: col,
      sortDir: prev.sortCol === col ? (prev.sortDir === 1 ? -1 : 1) : 1,
    }));
  }, []);

  // Build GridListRow for a feat
  const renderFeatRow = useCallback((feat: RTDBFeat, isCharacterFeat: boolean) => {
    const selectedList = isCharacterFeat ? selectedCharacterFeats : selectedArchetypeFeats;
    const maxForType = isCharacterFeat ? maxCharacterFeats : maxArchetypeFeats;
    
    const isSelected = selectedList.some(f => f.id === feat.id);
    const requirements = checkRequirements(feat);
    const canSelect = (selectedList.length < maxForType || isSelected) && requirements.met;
    
    // Build badges
    const badges: Array<{ label: string; color: 'blue' | 'purple' | 'amber' | 'gray' }> = [];
    if (isCharacterFeat) badges.push({ label: 'Character', color: 'blue' });
    else badges.push({ label: 'Archetype', color: 'amber' });
    if (feat.state_feat) badges.push({ label: 'State', color: 'purple' });
    if (feat.category) badges.push({ label: feat.category, color: 'gray' });
    
    // Build tag chips
    const tagChips: ChipData[] = feat.tags?.map(tag => ({
      name: tag,
      category: 'tag' as const,
    })) || [];
    
    // Requirements content
    const requirementsContent = (feat.ability_req?.length > 0 || feat.skill_req?.length > 0) ? (
      <div className="space-y-1 text-sm">
        {feat.ability_req?.length > 0 && (
          <div>
            <span className="font-medium text-text-secondary">Ability Requirements:</span>{' '}
            <span className="text-text-muted">
              {feat.ability_req.map((a, i) => {
                const val = feat.abil_req_val?.[i];
                return `${a}${typeof val === 'number' ? ` ${val}+` : ''}`;
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
                return `${s}${typeof val === 'number' ? ` ${val}+` : ''}`;
              }).join(', ')}
            </span>
          </div>
        )}
      </div>
    ) : undefined;

    return (
      <GridListRow
        key={feat.id}
        id={feat.id}
        name={feat.name}
        description={feat.description}
        gridColumns={FEAT_GRID_COLUMNS}
        columns={[
          { key: 'Level', value: feat.lvl_req || '-' },
          { key: 'Category', value: feat.category || '-' },
          { key: 'Uses', value: feat.uses_per_rec ? `${feat.uses_per_rec}/${feat.rec_period || 'rest'}` : '-' },
        ]}
        badges={badges}
        chips={tagChips}
        chipsLabel="Tags"
        requirements={requirementsContent}
        selectable
        isSelected={isSelected}
        onSelect={() => canSelect && toggleFeat(feat, isCharacterFeat)}
        disabled={!canSelect}
        warningMessage={!requirements.met ? requirements.reason : undefined}
      />
    );
  }, [selectedArchetypeFeats, selectedCharacterFeats, maxArchetypeFeats, maxCharacterFeats, checkRequirements, toggleFeat]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Select Feats</h1>
          <p className="text-text-secondary">
            Choose feats that grant special abilities and bonuses. Your archetype 
            ({archetypeType}) allows {maxArchetypeFeats} archetype feat{maxArchetypeFeats !== 1 ? 's' : ''} 
            {' '}and {maxCharacterFeats} character feat.
          </p>
        </div>
      </div>

      {/* Selected Feats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Archetype Feats Selected */}
        <div className={cn(
          'p-4 rounded-xl border-2',
          selectedArchetypeFeats.length === maxArchetypeFeats
            ? 'bg-green-50 border-green-300'
            : 'bg-amber-50 border-amber-300'
        )}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-text-primary">Archetype Feats</h3>
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-bold',
              selectedArchetypeFeats.length === maxArchetypeFeats
                ? 'bg-green-200 text-green-800'
                : 'bg-amber-200 text-amber-800'
            )}>
              {selectedArchetypeFeats.length} / {maxArchetypeFeats}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedArchetypeFeats.length === 0 ? (
              <span className="text-sm text-text-muted italic">None selected</span>
            ) : (
              selectedArchetypeFeats.map(feat => (
                <span
                  key={feat.id}
                  className="px-3 py-1 bg-white text-amber-700 rounded-full text-sm flex items-center gap-2 border border-amber-200"
                >
                  {feat.name}
                  <button
                    onClick={() => updateDraft({ feats: draft.feats?.filter(f => f.id !== feat.id) })}
                    className="hover:text-red-500 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Character Feats Selected */}
        <div className={cn(
          'p-4 rounded-xl border-2',
          selectedCharacterFeats.length === maxCharacterFeats
            ? 'bg-green-50 border-green-300'
            : 'bg-blue-50 border-blue-300'
        )}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-text-primary">Character Feats</h3>
            <span className={cn(
              'px-3 py-1 rounded-full text-sm font-bold',
              selectedCharacterFeats.length === maxCharacterFeats
                ? 'bg-green-200 text-green-800'
                : 'bg-blue-200 text-blue-800'
            )}>
              {selectedCharacterFeats.length} / {maxCharacterFeats}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCharacterFeats.length === 0 ? (
              <span className="text-sm text-text-muted italic">None selected</span>
            ) : (
              selectedCharacterFeats.map(feat => (
                <span
                  key={feat.id}
                  className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm flex items-center gap-2 border border-blue-200"
                >
                  {feat.name}
                  <button
                    onClick={() => updateDraft({ feats: draft.feats?.filter(f => f.id !== feat.id) })}
                    className="hover:text-red-500 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <SearchInput
          value={filters.search}
          onChange={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Search feats by name, description, or tags..."
        />
      </div>

      {/* Filters Panel - Codex Style */}
      <FilterSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <ChipSelect
            label="Category"
            placeholder="All categories"
            options={categories.map(c => ({ value: c, label: c }))}
            selectedValues={filters.categories}
            onSelect={(v) => setFilters(f => ({ ...f, categories: [...f.categories, v] }))}
            onRemove={(v) => setFilters(f => ({ ...f, categories: f.categories.filter(c => c !== v) }))}
          />

          {/* Feat Type Filter */}
          <SelectFilter
            label="Feat Type"
            value={filters.featType}
            options={[
              { value: 'all', label: 'All Feats' },
              { value: 'archetype', label: 'Archetype Only' },
              { value: 'character', label: 'Character Only' },
            ]}
            onChange={(v) => setFilters(f => ({ ...f, featType: v as 'all' | 'archetype' | 'character' }))}
            placeholder="All Feats"
          />

          {/* Hide Unqualified Toggle */}
          <div className="filter-group">
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Qualification Filter
            </label>
            <button
              onClick={() => setFilters(f => ({ ...f, hideUnqualified: !f.hideUnqualified }))}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left',
                filters.hideUnqualified
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-surface border-border-light text-text-secondary hover:bg-surface-alt'
              )}
            >
              {filters.hideUnqualified ? '✓ Hiding unqualified' : 'Show all feats'}
            </button>
            <p className="text-xs text-text-muted mt-1">
              {filters.hideUnqualified ? 'Only showing feats you qualify for' : 'Showing all feats including unqualified'}
            </p>
          </div>
        </div>
      </FilterSection>

      {/* Results Count */}
      <div className="text-sm text-text-muted mb-4">
        {filteredFeats.length} feats found
        {filters.hideUnqualified && ' (qualified only)'}
      </div>

      {/* Column Headers */}
      <div className="hidden lg:grid gap-4 px-4 py-3 bg-primary-50 border-b border-border-light rounded-t-lg font-semibold text-sm text-primary-700"
           style={{ gridTemplateColumns: FEAT_GRID_COLUMNS }}>
        <SortHeader label="NAME" col="name" sortState={{ col: filters.sortCol, dir: filters.sortDir }} onSort={handleSort} />
        <SortHeader label="LEVEL" col="lvl_req" sortState={{ col: filters.sortCol, dir: filters.sortDir }} onSort={handleSort} />
        <SortHeader label="CATEGORY" col="category" sortState={{ col: filters.sortCol, dir: filters.sortDir }} onSort={handleSort} />
        <span>USES</span>
        <span></span>
      </div>

      {/* Feats Lists - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-4">
        {/* Archetype Feats Column */}
        {(filters.featType === 'all' || filters.featType === 'archetype') && (
          <div>
            <h3 className="font-bold text-lg text-text-primary mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              Archetype Feats
              <span className="text-sm font-normal text-text-muted">
                ({selectedArchetypeFeats.length}/{maxArchetypeFeats})
              </span>
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {archetypeFeats.map(feat => renderFeatRow(feat, false))}
              {archetypeFeats.length === 0 && (
                <div className="text-center py-4 text-text-muted bg-surface-alt rounded-lg">
                  No archetype feats match your filters.
                  {filters.hideUnqualified && (
                    <button 
                      onClick={() => setFilters(f => ({ ...f, hideUnqualified: false }))}
                      className="block mx-auto mt-2 text-primary-600 hover:underline"
                    >
                      Show unqualified feats
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Character Feats Column */}
        {(filters.featType === 'all' || filters.featType === 'character') && (
          <div>
            <h3 className="font-bold text-lg text-text-primary mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Character Feats
              <span className="text-sm font-normal text-text-muted">
                ({selectedCharacterFeats.length}/{maxCharacterFeats})
              </span>
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {characterFeats.map(feat => renderFeatRow(feat, true))}
              {characterFeats.length === 0 && (
                <div className="text-center py-4 text-text-muted bg-surface-alt rounded-lg">
                  No character feats match your filters.
                  {filters.hideUnqualified && (
                    <button 
                      onClick={() => setFilters(f => ({ ...f, hideUnqualified: false }))}
                      className="block mx-auto mt-2 text-primary-600 hover:underline"
                    >
                      Show unqualified feats
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={prevStep}
        >
          ← Back
        </Button>
        <Button
          onClick={nextStep}
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}
