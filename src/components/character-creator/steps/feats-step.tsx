/**
 * Feats Step
 * ===========
 * Select character feats with real data from Firebase RTDB
 * Phase 1 fix: Separate archetype feats vs character feats with proper limits
 * 
 * Feat Limits by Archetype:
 * - Power: 1 archetype feat + 1 character feat
 * - Powered-Martial: 2 archetype feats + 1 character feat
 * - Martial: 3 archetype feats + 1 character feat
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useRTDBFeats, type RTDBFeat } from '@/hooks';
import { getArchetypeFeatLimit } from '@/lib/game/formulas';
import type { ArchetypeCategory } from '@/types';

// Character feats are always 1 at level 1
const CHARACTER_FEAT_LIMIT = 1;

interface SelectedFeat {
  id: string;
  name: string;
  description?: string;
  type: 'archetype' | 'character';
}

export function FeatsStep() {
  const { draft, nextStep, prevStep, updateDraft } = useCharacterCreatorStore();
  const { data: feats, isLoading } = useRTDBFeats();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [featTypeFilter, setFeatTypeFilter] = useState<'all' | 'archetype' | 'character'>('all');
  const [expandedFeat, setExpandedFeat] = useState<string | null>(null);

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

  // Get unique categories
  const categories = useMemo(() => {
    if (!feats) return [];
    const cats = new Set<string>();
    feats.forEach(f => f.category && cats.add(f.category));
    return Array.from(cats).sort();
  }, [feats]);

  // Filter feats
  const filteredFeats = useMemo(() => {
    if (!feats) return [];
    return feats.filter(feat => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = 
          feat.name.toLowerCase().includes(term) ||
          feat.description?.toLowerCase().includes(term) ||
          feat.tags.some(t => t.toLowerCase().includes(term));
        if (!matches) return false;
      }
      
      // Feat type filter
      if (featTypeFilter === 'archetype' && feat.char_feat) return false;
      if (featTypeFilter === 'character' && !feat.char_feat) return false;
      
      // Category filter
      if (categoryFilter && feat.category !== categoryFilter) return false;
      
      // Level requirement
      if (feat.lvl_req > (draft.level || 1)) return false;
      
      return true;
    });
  }, [feats, searchTerm, featTypeFilter, categoryFilter, draft.level]);

  // Separate filtered feats into archetype and character
  const { archetypeFeats, characterFeats } = useMemo(() => {
    const arch = filteredFeats.filter(f => !f.char_feat);
    const char = filteredFeats.filter(f => f.char_feat);
    return { archetypeFeats: arch, characterFeats: char };
  }, [filteredFeats]);

  const toggleFeat = (feat: RTDBFeat, isCharacterFeat: boolean) => {
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
  };

  const checkRequirements = (feat: RTDBFeat): { met: boolean; reason?: string } => {
    const abilities = draft.abilities || {};
    const skills = draft.skills || {};
    
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
    
    // Check martial ability requirement (for martial archetype feats)
    if (feat.mart_abil_req && draft.archetype?.mart_abil !== feat.mart_abil_req) {
      return { met: false, reason: `Requires ${feat.mart_abil_req} martial ability` };
    }
    
    return { met: true };
  };

  const renderFeatCard = (feat: RTDBFeat, isCharacterFeat: boolean) => {
    const selectedList = isCharacterFeat ? selectedCharacterFeats : selectedArchetypeFeats;
    const maxForType = isCharacterFeat ? maxCharacterFeats : maxArchetypeFeats;
    
    const isSelected = selectedList.some(f => f.id === feat.id);
    const isExpanded = expandedFeat === feat.id;
    const requirements = checkRequirements(feat);
    const canSelect = selectedList.length < maxForType || isSelected;
    
    return (
      <div
        key={feat.id}
        className={cn(
          'bg-white rounded-lg border overflow-hidden transition-all',
          isSelected ? 'border-primary-400 bg-primary-50' : 'border-gray-200',
          !requirements.met && 'opacity-60'
        )}
      >
        <div className="p-3 flex items-center gap-3">
          <button
            onClick={() => requirements.met && canSelect && toggleFeat(feat, isCharacterFeat)}
            disabled={!requirements.met || !canSelect}
            className={cn(
              'w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
              isSelected
                ? 'bg-primary-600 border-primary-600 text-white'
                : requirements.met && canSelect
                  ? 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
                  : 'border-gray-200 bg-gray-100 cursor-not-allowed'
            )}
          >
            {isSelected && '✓'}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900">{feat.name}</span>
              {feat.category && (
                <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                  {feat.category}
                </span>
              )}
              {!requirements.met && (
                <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded">
                  {requirements.reason}
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setExpandedFeat(isExpanded ? null : feat.id)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
        
        {isExpanded && (
          <div className="px-3 pb-3 pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-700">{feat.description}</p>
            
            {feat.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {feat.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 text-xs bg-primary-50 text-primary-700 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Select Feats</h1>
          <p className="text-gray-600">
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
            <h3 className="font-bold text-gray-900">Archetype Feats</h3>
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
              <span className="text-sm text-gray-500 italic">None selected</span>
            ) : (
              selectedArchetypeFeats.map(feat => (
                <span
                  key={feat.id}
                  className="px-3 py-1 bg-white text-primary-700 rounded-full text-sm flex items-center gap-2 border border-primary-200"
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
            <h3 className="font-bold text-gray-900">Character Feats</h3>
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
              <span className="text-sm text-gray-500 italic">None selected</span>
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

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-center border border-gray-200">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search feats..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        />
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFeatTypeFilter('all')}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              featTypeFilter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            All
          </button>
          <button
            onClick={() => setFeatTypeFilter('archetype')}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              featTypeFilter === 'archetype'
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            Archetype
          </button>
          <button
            onClick={() => setFeatTypeFilter('character')}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              featTypeFilter === 'character'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            Character
          </button>
        </div>
      </div>

      {/* Feats Lists - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Archetype Feats Column */}
        {(featTypeFilter === 'all' || featTypeFilter === 'archetype') && (
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              Archetype Feats
              <span className="text-sm font-normal text-gray-500">
                ({selectedArchetypeFeats.length}/{maxArchetypeFeats})
              </span>
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {archetypeFeats.map(feat => renderFeatCard(feat, false))}
              {archetypeFeats.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No archetype feats match your filters.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Character Feats Column */}
        {(featTypeFilter === 'all' || featTypeFilter === 'character') && (
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Character Feats
              <span className="text-sm font-normal text-gray-500">
                ({selectedCharacterFeats.length}/{maxCharacterFeats})
              </span>
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {characterFeats.map(feat => renderFeatCard(feat, true))}
              {characterFeats.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No character feats match your filters.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="btn-back"
        >
          ← Back
        </button>
        <button
          onClick={nextStep}
          className="btn-continue"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
