/**
 * Add Feat Modal
 * ==============
 * Modal for adding archetype or character feats from RTDB
 * Uses unified GridListRow component for consistent styling.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { ref, get } from 'firebase/database';
import { rtdb } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Spinner, SearchInput, Checkbox, IconButton, Alert } from '@/components/ui';
import { GridListRow } from '@/components/shared';
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
  // Build badges from category
  const badges: Array<{ label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' }> = [];
  if (feat.category) {
    badges.push({ label: feat.category, color: 'gray' });
  }

  // Build columns for level requirement
  const columns = feat.lvl_req && feat.lvl_req > 1
    ? [{ key: 'Level', value: `${feat.lvl_req}+` }]
    : [];

  return (
    <GridListRow
      id={feat.id}
      name={feat.name}
      description={feat.description || feat.effect || 'No description available.'}
      columns={columns}
      badges={badges}
      selectable
      isSelected={isSelected}
      onSelect={onToggle}
      disabled={!meetsRequirements}
      warningMessage={requirementWarning}
      compact
    />
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
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
          <h2 className="text-lg font-bold text-text-primary">
            Add {featType === 'archetype' ? 'Archetype' : 'Character'} Feat
          </h2>
          <IconButton
            label="Close modal"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b border-border-subtle space-y-2">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search feats..."
            size="sm"
          />
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory('')}
              className={cn(
                'px-3 py-1 rounded-full text-sm transition-colors',
                !selectedCategory
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-alt text-text-muted hover:bg-surface'
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
                    : 'bg-surface-alt text-text-muted hover:bg-surface'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
            
            {/* Show Eligible Only toggle */}
            <Checkbox
              label="Show eligible only"
              checked={showEligibleOnly}
              onChange={(e) => setShowEligibleOnly(e.target.checked)}
            />
          {loading && (
            <div className="text-center py-8">
              <Spinner size="md" className="mx-auto mb-2" />
              <p className="text-text-muted">Loading feats...</p>
            </div>
          )}

          {error && (
            <Alert variant="danger" className="mx-4">
              {error}
            </Alert>
          )}

          {!loading && !error && filteredFeats.length === 0 && (
            <p className="text-center py-8 text-text-muted italic">
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-light bg-surface-alt">
          <span className="text-sm text-text-muted">
            {selectedFeats.length} feat{selectedFeats.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-text-secondary hover:bg-surface transition-colors"
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
                  : 'bg-surface text-text-muted cursor-not-allowed'
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
