/**
 * Add Feat Modal
 * ==============
 * Modal for adding archetype or character feats from RTDB
 * Uses unified GridListRow component for Codex-style list display.
 * Simplified filters for modal context.
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ref, get } from 'firebase/database';
import { rtdb } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Spinner, IconButton, Alert, Checkbox } from '@/components/ui';
import { SearchInput, SortHeader, GridListRow, type ChipData } from '@/components/shared';
import type { Character } from '@/types';

interface Feat {
  id: string;
  name: string;
  description?: string;
  effect?: string;
  category?: string;
  ability?: string;
  lvl_req?: number;
  ability_req?: string[];
  abil_req_val?: number[];
  skill_req?: string[];
  skill_req_val?: number[];
  char_feat?: boolean;
  state_feat?: boolean;
  max_uses?: number;
  uses_per_rec?: number;
  rec_period?: string;
  tags?: string[];
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

// Grid columns for feat modal
const MODAL_FEAT_GRID_COLUMNS = '1.5fr 0.6fr 0.6fr 0.8fr';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAbility, setSelectedAbility] = useState<string>('');
  const [showStateFeats, setShowStateFeats] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [selectedFeats, setSelectedFeats] = useState<Feat[]>([]);
  const [sortState, setSortState] = useState<{ col: string; dir: 1 | -1 }>({ col: 'name', dir: 1 });

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
      setSelectedAbility('');
      setShowStateFeats(false);
      setShowBlocked(false);
    }
  }, [isOpen]);

  // Get unique filter values
  const { categories, abilities } = useMemo(() => {
    const cats = new Set<string>();
    const abils = new Set<string>();
    
    feats.forEach(f => {
      // Only count feats of the correct type for filter options
      if (featType === 'character' && !f.char_feat) return;
      if (featType === 'archetype' && f.char_feat) return;
      
      if (f.category) cats.add(f.category);
      if (f.ability) abils.add(f.ability);
    });
    
    return {
      categories: Array.from(cats).sort(),
      abilities: Array.from(abils).sort(),
    };
  }, [feats, featType]);

  // Check if feat requirements are met
  const checkRequirements = useCallback((feat: Feat): { meets: boolean; warning?: string } => {
    const warnings: string[] = [];
    
    // Level requirement - auto filter based on character level
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
  }, [character]);

  // Filter feats
  const filteredFeats = useMemo(() => {
    return feats.filter(feat => {
      // Filter by feat type (archetype vs character)
      if (featType === 'character' && !feat.char_feat) return false;
      if (featType === 'archetype' && feat.char_feat) return false;
      
      // Exclude already owned feats
      if (existingFeatIds.includes(feat.id) || existingFeatIds.includes(feat.name)) return false;
      
      // State feats filter
      if (!showStateFeats && feat.state_feat) return false;
      
      // Check requirements - hide blocked unless showBlocked
      const { meets } = checkRequirements(feat);
      if (!meets && !showBlocked) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!feat.name.toLowerCase().includes(query) && 
            !feat.description?.toLowerCase().includes(query) &&
            !feat.tags?.some(t => t.toLowerCase().includes(query))) {
          return false;
        }
      }
      
      // Category filter
      if (selectedCategory && feat.category !== selectedCategory) return false;
      
      // Ability filter
      if (selectedAbility && feat.ability !== selectedAbility) return false;
      
      return true;
    }).sort((a, b) => {
      const col = sortState.col;
      let aVal: any = a[col as keyof Feat];
      let bVal: any = b[col as keyof Feat];
      
      // Handle undefined values
      if (aVal === undefined) aVal = '';
      if (bVal === undefined) bVal = '';
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortState.dir * aVal.localeCompare(bVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortState.dir * (aVal - bVal);
      }
      return 0;
    });
  }, [feats, featType, existingFeatIds, searchQuery, selectedCategory, selectedAbility, showStateFeats, showBlocked, checkRequirements, sortState]);

  const handleSort = useCallback((col: string) => {
    setSortState(prev => ({
      col,
      dir: prev.col === col ? (prev.dir === 1 ? -1 : 1) : 1,
    }));
  }, []);

  const toggleFeat = useCallback((feat: Feat) => {
    setSelectedFeats(prev => {
      const exists = prev.some(f => f.id === feat.id);
      if (exists) {
        return prev.filter(f => f.id !== feat.id);
      } else {
        return [...prev, feat];
      }
    });
  }, []);

  const handleConfirm = () => {
    if (selectedFeats.length > 0) {
      onAdd(selectedFeats);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header - Codex style */}
        <div className="px-6 py-4 border-b border-border-light bg-gradient-to-r from-primary-50 to-surface">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Add {featType === 'archetype' ? 'Archetype' : 'Character'} Feat
              </h2>
              <p className="text-sm text-text-muted mt-0.5">
                Select feats to add to your character. Feats are filtered by your level and requirements.
              </p>
            </div>
            <IconButton
              label="Close modal"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </IconButton>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-6 py-4 border-b border-border-subtle bg-surface-alt space-y-3">
          {/* Search */}
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search feats by name, description, or tags..."
          />
          
          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-muted">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm px-2 py-1 rounded-lg border border-border-light bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {/* Ability filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-text-muted">Ability:</label>
              <select
                value={selectedAbility}
                onChange={(e) => setSelectedAbility(e.target.value)}
                className="text-sm px-2 py-1 rounded-lg border border-border-light bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All</option>
                {abilities.map(abil => (
                  <option key={abil} value={abil}>{abil}</option>
                ))}
              </select>
            </div>
            
            {/* State feats toggle */}
            <Checkbox
              label="Show state feats"
              checked={showStateFeats}
              onChange={(e) => setShowStateFeats(e.target.checked)}
            />
            
            {/* Show blocked toggle */}
            <Checkbox
              label="Show blocked"
              checked={showBlocked}
              onChange={(e) => setShowBlocked(e.target.checked)}
            />
          </div>
        </div>

        {/* Column Headers */}
        <div 
          className="hidden md:grid gap-2 px-4 py-2 bg-surface-alt border-b border-border-subtle text-xs font-medium text-text-muted uppercase tracking-wide"
          style={{ gridTemplateColumns: MODAL_FEAT_GRID_COLUMNS }}
        >
          <SortHeader label="Name" col="name" sortState={sortState} onSort={handleSort} />
          <SortHeader label="Rec." col="rec_period" sortState={sortState} onSort={handleSort} />
          <SortHeader label="Uses" col="uses_per_rec" sortState={sortState} onSort={handleSort} />
          <SortHeader label="Category" col="category" sortState={sortState} onSort={handleSort} />
        </div>

        {/* Feat List - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" className="mr-2" />
              <span className="text-text-muted">Loading feats...</span>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-4">{error}</Alert>
          ) : filteredFeats.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              No feats match your filters.
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {filteredFeats.map(feat => {
                const { meets, warning } = checkRequirements(feat);
                const isSelected = selectedFeats.some(f => f.id === feat.id);
                
                // Build chips from tags
                const chips: ChipData[] = feat.tags?.map(tag => ({
                  name: tag,
                  category: 'tag' as const,
                })) || [];
                
                return (
                  <GridListRow
                    key={feat.id}
                    id={feat.id}
                    name={feat.name}
                    description={feat.description || feat.effect}
                    gridColumns={MODAL_FEAT_GRID_COLUMNS}
                    columns={[
                      { key: 'Recovery', value: feat.rec_period || '-' },
                      { key: 'Uses', value: feat.uses_per_rec || feat.max_uses || '-' },
                      { key: 'Category', value: feat.category || '-' },
                    ]}
                    chips={chips}
                    chipsLabel="Tags"
                    selectable
                    isSelected={isSelected}
                    onSelect={() => toggleFeat(feat)}
                    disabled={!meets && !showBlocked}
                    warningMessage={!meets ? warning : undefined}
                    compact
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-light bg-surface-alt">
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">
              {filteredFeats.length} feats available
            </span>
            {selectedFeats.length > 0 && (
              <span className="text-sm font-medium text-primary-600">
                {selectedFeats.length} selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
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
                'px-6 py-2 rounded-lg font-medium transition-colors',
                selectedFeats.length > 0
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-surface text-text-muted cursor-not-allowed'
              )}
            >
              Add Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
