/**
 * Add Feat Modal
 * ==============
 * Modal for adding archetype or character feats from RTDB
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { ref, get } from 'firebase/database';
import { rtdb } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';
import { X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { Character } from '@/types';

interface Feat {
  id: string;
  name: string;
  description?: string;
  effect?: string;
  category?: string;
  lvl_req?: number;
  ability_req?: string[];
  abil_req_val?: number[];
  skill_req?: string[];
  skill_req_val?: number[];
  char_feat?: boolean;
  state_feat?: boolean;
  max_uses?: number;
}

interface AddFeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  featType: 'archetype' | 'character';
  character: Character;
  existingFeatIds: (string | number)[];
  onAdd: (feats: Feat[]) => void;
}

// Roman numeral utilities
const ROMAN_TO_NUM: Record<string, number> = { 
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 
  'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10 
};

function parseFeatLevel(name: string): { baseName: string; level: number; hasLevel: boolean } {
  if (!name) return { baseName: name, level: 1, hasLevel: false };
  
  const match = name.match(/^(.+?)\s+(I{1,3}|IV|VI{0,3}|IX|X)$/i);
  if (match) {
    const baseName = match[1].trim();
    const roman = match[2].toUpperCase();
    const level = ROMAN_TO_NUM[roman] || 1;
    return { baseName, level, hasLevel: true };
  }
  
  return { baseName: name, level: 1, hasLevel: false };
}

function FeatRow({
  feat,
  isSelected,
  onToggle,
  meetsRequirements,
  requirementWarning,
}: {
  feat: Feat;
  isSelected: boolean;
  onToggle: () => void;
  meetsRequirements: boolean;
  requirementWarning?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all',
        isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200',
        !meetsRequirements && 'opacity-50'
      )}
    >
      <div className="flex items-center">
        <button
          onClick={onToggle}
          disabled={!meetsRequirements}
          className={cn(
            'w-8 h-8 flex items-center justify-center border-r',
            isSelected ? 'bg-primary-500 text-white' : 'bg-gray-50 text-gray-400',
            !meetsRequirements && 'cursor-not-allowed'
          )}
        >
          {isSelected ? '✓' : '+'}
        </button>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">{feat.name}</span>
            {feat.category && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {feat.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {feat.lvl_req && feat.lvl_req > 1 && (
              <span className="text-xs text-gray-500">Lvl {feat.lvl_req}+</span>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </button>
      </div>

      {expanded && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            {feat.description || feat.effect || 'No description available.'}
          </p>
          {requirementWarning && (
            <p className="text-xs text-amber-600 mt-2">⚠️ {requirementWarning}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function AddFeatModal({
  isOpen,
  onClose,
  featType,
  character,
  existingFeatIds,
  onAdd,
}: AddFeatModalProps) {
  const [feats, setFeats] = useState<Feat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFeats, setSelectedFeats] = useState<Feat[]>([]);
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);

  // Load feats from RTDB
  useEffect(() => {
    if (!isOpen) return;
    
    const loadFeats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const snapshot = await get(ref(rtdb, 'feats'));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const featList = Object.entries(data).map(([id, feat]) => ({
            id,
            ...(feat as Omit<Feat, 'id'>),
          }));
          setFeats(featList);
        }
      } catch (e) {
        setError(`Failed to load feats: ${e instanceof Error ? e.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadFeats();
  }, [isOpen]);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedFeats([]);
      setSearchQuery('');
      setSelectedCategory('');
      setShowEligibleOnly(false);
    }
  }, [isOpen]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    feats.forEach(f => {
      if (f.category) cats.add(f.category);
    });
    return Array.from(cats).sort();
  }, [feats]);

  // Check if feat requirements are met (must be defined before filteredFeats useMemo)
  const checkRequirements = (feat: Feat): { meets: boolean; warning?: string } => {
    const warnings: string[] = [];
    
    // Level requirement
    if (feat.lvl_req && character.level < feat.lvl_req) {
      warnings.push(`Requires level ${feat.lvl_req}`);
    }
    
    // Ability requirements
    if (feat.ability_req && feat.abil_req_val) {
      const abilities = character.abilities || {};
      feat.ability_req.forEach((abil, idx) => {
        const required = feat.abil_req_val?.[idx] ?? 0;
        const current = abilities[abil.toLowerCase() as keyof typeof abilities] ?? 0;
        if (current < required) {
          warnings.push(`Requires ${abil} ${required}+`);
        }
      });
    }
    
    // Check for leveled feat prerequisites
    const { baseName, level } = parseFeatLevel(feat.name);
    if (level > 1) {
      // Check if character has the prerequisite level feat
      const allCharFeats = [...(character.archetypeFeats || []), ...(character.feats || [])];
      const hasPrereq = allCharFeats.some(f => {
        const parsed = parseFeatLevel(f.name);
        return parsed.baseName === baseName && parsed.level === level - 1;
      });
      if (!hasPrereq) {
        const prevRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][level - 2] || 'I';
        warnings.push(`Requires ${baseName} ${prevRoman}`);
      }
    }
    
    return {
      meets: warnings.length === 0,
      warning: warnings.join(', '),
    };
  };

  // Filter feats based on type, search, category, and eligibility
  const filteredFeats = useMemo(() => {
    return feats.filter(feat => {
      // Filter by feat type
      if (featType === 'character' && !feat.char_feat) return false;
      if (featType === 'archetype' && feat.char_feat) return false;
      
      // Exclude already owned feats
      if (existingFeatIds.includes(feat.id) || existingFeatIds.includes(feat.name)) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!feat.name.toLowerCase().includes(query) && 
            !feat.description?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Category filter
      if (selectedCategory && feat.category !== selectedCategory) return false;
      
      // Show eligible only filter
      if (showEligibleOnly && !checkRequirements(feat).meets) return false;
      
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  // Note: checkRequirements uses character which may change, so we include it implicitly
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feats, featType, existingFeatIds, searchQuery, selectedCategory, showEligibleOnly, character]);

  const toggleFeat = (feat: Feat) => {
    setSelectedFeats(prev => {
      const exists = prev.some(f => f.id === feat.id);
      if (exists) {
        return prev.filter(f => f.id !== feat.id);
      } else {
        return [...prev, feat];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedFeats.length > 0) {
      onAdd(selectedFeats);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Add {featType === 'archetype' ? 'Archetype' : 'Character'} Feat
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b border-gray-100 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feats..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('')}
              className={cn(
                'px-3 py-1 rounded-full text-sm transition-colors',
                !selectedCategory
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm transition-colors',
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
            
            {/* Show Eligible Only toggle */}
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showEligibleOnly}
                onChange={(e) => setShowEligibleOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-600">Show eligible only</span>
            </label>
          {loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading feats...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && filteredFeats.length === 0 && (
            <p className="text-center py-8 text-gray-500 italic">
              No feats available
            </p>
          )}

          {!loading && !error && filteredFeats.length > 0 && (
            <div className="space-y-2">
              {filteredFeats.map(feat => {
                const { meets, warning } = checkRequirements(feat);
                return (
                  <FeatRow
                    key={feat.id}
                    feat={feat}
                    isSelected={selectedFeats.some(f => f.id === feat.id)}
                    onToggle={() => toggleFeat(feat)}
                    meetsRequirements={meets}
                    requirementWarning={warning}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <span className="text-sm text-gray-500">
            {selectedFeats.length} feat{selectedFeats.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedFeats.length === 0}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                selectedFeats.length > 0
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              Add {selectedFeats.length > 0 ? `(${selectedFeats.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
