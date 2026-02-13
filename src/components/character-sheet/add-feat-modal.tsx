/**
 * Add Feat Modal
 * ==============
 * Modal for adding archetype or character feats from Codex
 * Uses unified GridListRow component for Codex-style list display.
 * Simplified filters for modal context.
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCodexFeats, useCodexSkills, type Feat, type Skill } from '@/hooks';
import { getSkillBonusForFeatRequirement } from '@/lib/game/formulas';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Spinner, IconButton, Alert, Checkbox, Modal, Button } from '@/components/ui';
import { SearchInput, ListHeader, GridListRow, type ChipData } from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import type { Character } from '@/types';

// Feat shape for modal (extends Codex Feat with modal-specific fields)
interface FeatModal extends Feat {
  effect?: string;
  max_uses?: number;
}

interface AddFeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  featType: 'archetype' | 'character';
  character: Character;
  existingFeatIds: (string | number)[];
  onAdd: (feats: FeatModal[]) => void;
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

// Grid columns for feat modal (includes 2.5rem for Add button on right)
const MODAL_FEAT_GRID_COLUMNS = '1.5fr 0.6fr 0.6fr 0.8fr 2.5rem';

export function AddFeatModal({
  isOpen,
  onClose,
  featType,
  character,
  existingFeatIds,
  onAdd,
}: AddFeatModalProps) {
  const { data: codexFeats = [], isLoading: loading, error: queryError } = useCodexFeats();
  const { data: codexSkills = [] } = useCodexSkills();
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAbility, setSelectedAbility] = useState<string>('');
  const [showStateFeats, setShowStateFeats] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [selectedFeats, setSelectedFeats] = useState<FeatModal[]>([]);
  const { sortState, handleSort, sortItems } = useSort('name');

  // Map Codex feats to modal shape (Codex Feat has all required fields)
  const feats = useMemo((): FeatModal[] => {
    if (!codexFeats || !Array.isArray(codexFeats)) return [];
    return codexFeats.map((f) => ({
      ...f,
      id: String(f.id),
      effect: f.description,
      max_uses: f.uses_per_rec,
    }));
  }, [codexFeats]);

  useEffect(() => {
    if (queryError) setError(`Failed to load feats: ${queryError.message}`);
    else setError(null);
  }, [queryError]);

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
      if (f.ability) {
        if (Array.isArray(f.ability)) {
          f.ability.forEach(a => abils.add(a));
        } else {
          abils.add(f.ability);
        }
      }
    });
    
    return {
      categories: Array.from(cats).sort(),
      abilities: Array.from(abils).sort(),
    };
  }, [feats, featType]);

  // Map skill ID -> name for display/requirements
  const skillIdToName = useMemo(() => {
    const map = new Map<string, string>();
    (codexSkills as Skill[]).forEach((s) => {
      map.set(String(s.id), s.name);
    });
    return map;
  }, [codexSkills]);

  // Check if feat requirements are met
  const checkRequirements = useCallback((feat: FeatModal): { meets: boolean; warning?: string } => {
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

    // Skill requirements: skill_req_val = required SKILL BONUS (not value). Proficiency required for all.
    if (feat.skill_req && feat.skill_req_val) {
      const charSkills = character.skills || {};
      let skillsForReq: Record<string, { prof?: boolean; val?: number }>;
      if (Array.isArray(charSkills)) {
        skillsForReq = {};
        (charSkills as Array<{ id?: string; name?: string; skill_val?: number; prof?: boolean }>).forEach((s) => {
          const id = s.id != null ? String(s.id) : '';
          const name = s.name != null ? String(s.name) : '';
          const entry = { prof: s.prof ?? false, val: s.skill_val ?? 0 };
          if (id) skillsForReq[id] = entry;
          if (name && name !== id) skillsForReq[name] = entry;
        });
      } else if (typeof charSkills === 'object') {
        skillsForReq = charSkills as Record<string, { prof?: boolean; val?: number }>;
      } else {
        skillsForReq = {};
      }
      feat.skill_req.forEach((skillId, idx) => {
        const requiredBonus = feat.skill_req_val?.[idx] ?? 1;
        const skillName = skillIdToName.get(String(skillId)) || String(skillId);
        const { bonus, proficient } = getSkillBonusForFeatRequirement(
          String(skillId),
          character.abilities || {},
          skillsForReq,
          codexSkills
        );
        if (!proficient) {
          warnings.push(`Requires proficiency in ${skillName}`);
        } else if (bonus < requiredBonus) {
          warnings.push(`Requires ${skillName} bonus ${requiredBonus}+ (yours: ${bonus})`);
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
  }, [character, skillIdToName, codexSkills]);

  // Filter feats
  const filteredFeats = useMemo(() => {
    const filtered = feats.filter(feat => {
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
        if (!String(feat.name ?? '').toLowerCase().includes(query) && 
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
    });
    return sortItems(filtered.map(f => ({ ...f, category: f.category ?? '', ability: f.ability ?? '' })));
  }, [feats, featType, existingFeatIds, searchQuery, selectedCategory, selectedAbility, showStateFeats, showBlocked, checkRequirements, sortItems]);

  const toggleFeat = useCallback((feat: FeatModal) => {
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

  // Custom header for Modal
  const modalHeader = (
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
  );
  
  // Custom footer for Modal
  const modalFooter = (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border-light bg-surface-alt">
      <div className="flex items-center gap-4">
        {selectedFeats.length > 0 && (
          <span className="text-sm font-medium text-primary-600">
            {selectedFeats.length} selected
          </span>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={selectedFeats.length === 0}
        >
          Add Selected
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      header={modalHeader}
      footer={modalFooter}
      showCloseButton={false}
      flexLayout
      contentClassName=""
      className="max-h-[85vh]"
    >
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

        {/* Column Headers - ListHeader with sort, no Add column title, rounded and inset */}
        <div className="px-6">
          <ListHeader
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'rec_period', label: 'Rec.' },
              { key: 'uses_per_rec', label: 'Uses' },
              { key: 'category', label: 'Category' },
            ]}
            gridColumns="1.5fr 0.6fr 0.6fr 0.8fr"
            sortState={sortState}
            onSort={handleSort}
            hasSelectionColumn
            className="rounded-lg mx-0"
          />
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
            <div className="flex flex-col gap-2 px-2 pt-2 pb-2">
              {filteredFeats.map(feat => {
                const { meets, warning } = checkRequirements(feat);
                const isSelected = selectedFeats.some(f => f.id === feat.id);
                
                // Build detail sections (Type, Category, Tags, Requirements) - consistent header+chips format
                const detailSections: Array<{ label: string; chips: ChipData[]; hideLabelIfSingle?: boolean }> = [];
                
                const typeChips: ChipData[] = [];
                if (feat.char_feat) typeChips.push({ name: 'Character Feat', category: 'skill' });
                else typeChips.push({ name: 'Archetype Feat', category: 'archetype' });
                if (feat.state_feat) typeChips.push({ name: 'State Feat', category: 'archetype' });
                if (typeChips.length > 0) {
                  detailSections.push({ label: 'Type', chips: typeChips, hideLabelIfSingle: true });
                }
                if (feat.category) {
                  detailSections.push({ label: 'Category', chips: [{ name: feat.category, category: 'default' }], hideLabelIfSingle: true });
                }
                const tagChips: ChipData[] = feat.tags?.map(tag => ({ name: tag, category: 'tag' as const })) || [];
                if (tagChips.length > 0) {
                  detailSections.push({ label: 'Tags', chips: tagChips, hideLabelIfSingle: true });
                }
                const abilityReqChips: ChipData[] = (feat.ability_req || []).map((a, i) => {
                  const val = feat.abil_req_val?.[i];
                  return { name: `${a}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'default' as const };
                });
                if (abilityReqChips.length > 0) {
                  detailSections.push({ label: 'Ability Requirements', chips: abilityReqChips });
                }
                const skillReqChips: ChipData[] = (feat.skill_req || []).map((id, i) => {
                  const label = skillIdToName.get(String(id)) || String(id);
                  const val = feat.skill_req_val?.[i];
                  return { name: `${label}${typeof val === 'number' ? ` ${val}+` : ''}`, category: 'skill' as const };
                });
                if (skillReqChips.length > 0) {
                  detailSections.push({ label: 'Skill Requirements', chips: skillReqChips });
                }
                
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
                    detailSections={detailSections.length > 0 ? detailSections : undefined}
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
      </Modal>
  );
}
