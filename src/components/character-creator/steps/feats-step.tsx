/**
 * Feats Step
 * ===========
 * Select character feats with real data from Firebase RTDB
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useRTDBFeats, type RTDBFeat } from '@/hooks';
import { calculateMaxCharacterFeats } from '@/lib/game/formulas';

export function FeatsStep() {
  const { draft, nextStep, prevStep, updateDraft } = useCharacterCreatorStore();
  const { data: feats, isLoading } = useRTDBFeats();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showArchetype, setShowArchetype] = useState(true);
  const [showCharacter, setShowCharacter] = useState(true);
  const [expandedFeat, setExpandedFeat] = useState<string | null>(null);

  // Get max feats based on level
  const maxFeats = calculateMaxCharacterFeats(draft.level || 1);
  
  // Get selected feat IDs from draft
  const selectedFeatIds = useMemo(() => {
    return draft.feats?.map(f => f.id) || [];
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
      
      // Type filter
      if (!showArchetype && !feat.char_feat) return false;
      if (!showCharacter && feat.char_feat) return false;
      
      // Category filter
      if (categoryFilter && feat.category !== categoryFilter) return false;
      
      // Level requirement
      if (feat.lvl_req > (draft.level || 1)) return false;
      
      return true;
    });
  }, [feats, searchTerm, showArchetype, showCharacter, categoryFilter, draft.level]);

  const toggleFeat = (feat: RTDBFeat) => {
    const isSelected = selectedFeatIds.includes(feat.id);
    
    if (isSelected) {
      // Remove feat
      updateDraft({
        feats: draft.feats?.filter(f => f.id !== feat.id) || []
      });
    } else {
      // Add feat if not at max
      if (selectedFeatIds.length >= maxFeats) return;
      
      updateDraft({
        feats: [
          ...(draft.feats || []),
          {
            id: feat.id,
            name: feat.name,
            description: feat.description,
            type: feat.char_feat ? 'character' : 'archetype',
          }
        ]
      });
    }
  };

  const checkRequirements = (feat: RTDBFeat): { met: boolean; reason?: string } => {
    const abilities = draft.abilities || {};
    
    // Check ability requirements
    for (let i = 0; i < feat.ability_req.length; i++) {
      const reqAbility = feat.ability_req[i].toLowerCase() as keyof typeof abilities;
      const reqValue = feat.abil_req_val[i] || 0;
      const charValue = abilities[reqAbility] || 0;
      
      if (charValue < reqValue) {
        return { met: false, reason: `Requires ${feat.ability_req[i]} ${reqValue}+` };
      }
    }
    
    return { met: true };
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
            Choose feats that grant special abilities and bonuses.
          </p>
        </div>
        
        <div className={cn(
          'px-4 py-2 rounded-xl font-bold text-lg',
          selectedFeatIds.length < maxFeats
            ? 'bg-blue-100 text-blue-700'
            : 'bg-green-100 text-green-700'
        )}>
          {selectedFeatIds.length} / {maxFeats} Feats
        </div>
      </div>

      {/* Selected Feats Summary */}
      {selectedFeatIds.length > 0 && (
        <div className="bg-primary-50 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-primary-800 mb-2">Selected Feats</h3>
          <div className="flex flex-wrap gap-2">
            {draft.feats?.map(feat => (
              <span
                key={feat.id}
                className="px-3 py-1 bg-white text-primary-700 rounded-full text-sm flex items-center gap-2"
              >
                {feat.name}
                <button
                  onClick={() => toggleFeat({ id: feat.id, name: feat.name } as RTDBFeat)}
                  className="hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search feats..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg"
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
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showArchetype}
            onChange={(e) => setShowArchetype(e.target.checked)}
            className="w-4 h-4 rounded text-primary-600"
          />
          <span className="text-sm">Archetype</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showCharacter}
            onChange={(e) => setShowCharacter(e.target.checked)}
            className="w-4 h-4 rounded text-primary-600"
          />
          <span className="text-sm">Character</span>
        </label>
      </div>

      {/* Feats List */}
      <div className="space-y-2 mb-8 max-h-[500px] overflow-y-auto">
        {filteredFeats.map(feat => {
          const isSelected = selectedFeatIds.includes(feat.id);
          const isExpanded = expandedFeat === feat.id;
          const requirements = checkRequirements(feat);
          const canSelect = selectedFeatIds.length < maxFeats || isSelected;
          
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
                  onClick={() => requirements.met && canSelect && toggleFeat(feat)}
                  disabled={!requirements.met || !canSelect}
                  className={cn(
                    'w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0',
                    isSelected
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : requirements.met && canSelect
                        ? 'border-gray-300 hover:border-primary-400'
                        : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                  )}
                >
                  {isSelected && '✓'}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{feat.name}</span>
                    {feat.char_feat && (
                      <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        Character
                      </span>
                    )}
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
                  className="text-gray-400 hover:text-gray-600"
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
        })}
        
        {filteredFeats.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No feats match your filters.
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100"
        >
          ← Back
        </button>
        <button
          onClick={nextStep}
          className="px-8 py-3 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
