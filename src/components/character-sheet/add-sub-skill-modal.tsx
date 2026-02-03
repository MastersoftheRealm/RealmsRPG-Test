/**
 * Add Sub-Skill Modal
 * ===================
 * Modal for adding sub-skills from RTDB
 * Features:
 * - Shows ALL sub-skills (not just for proficient base skills)
 * - If base skill is not in character's list, auto-adds it unproficiently
 * - Matches Codex skills page design
 * - Expandable skill rows with descriptions
 * - Fully rounded edges
 * - Uses ID-based base_skill lookups (base_skill_id = 0 means "any base skill")
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, ChevronDown, ChevronRight, Check, Plus, AlertCircle } from 'lucide-react';
import { Spinner, SearchInput, IconButton, Alert, Button, Select } from '@/components/ui';
import { useRTDBSkills, type RTDBSkill } from '@/hooks';

interface CharacterSkill {
  id?: string;
  name: string;
  prof?: boolean;
}

interface AddSubSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterSkills: CharacterSkill[];
  existingSkillNames: string[];
  onAdd: (skills: Array<RTDBSkill & { selectedBaseSkillId?: string; autoAddBaseSkill?: RTDBSkill }>) => void;
}

const ABILITY_OPTIONS = [
  { value: 'strength', label: 'Strength' },
  { value: 'vitality', label: 'Vitality' },
  { value: 'agility', label: 'Agility' },
  { value: 'acuity', label: 'Acuity' },
  { value: 'intelligence', label: 'Intelligence' },
  { value: 'charisma', label: 'Charisma' },
];

function ExpandableSubSkillRow({
  skill,
  isSelected,
  onToggle,
  baseSkillName,
  isAnyBaseSkill,
  hasBaseSkill,
  selectedBaseSkillId,
  onBaseSkillSelect,
  allBaseSkills,
}: {
  skill: RTDBSkill;
  isSelected: boolean;
  onToggle: () => void;
  baseSkillName: string;
  isAnyBaseSkill: boolean;
  hasBaseSkill: boolean;
  selectedBaseSkillId?: string;
  onBaseSkillSelect?: (skillId: string) => void;
  allBaseSkills: Array<{ id: string; name: string }>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Format abilities for display
  const abilities = skill.ability?.split(',').map(a => a.trim()).filter(Boolean) || [];
  
  return (
    <div className={cn(
      'border rounded-lg transition-colors hover:border-primary-200',
      isSelected ? 'border-primary-400 bg-primary-50' : 'border-border-light'
    )}>
      {/* Header Row - Entire row is clickable to expand */}
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Expand Button */}
        <span
          className="text-text-muted transition-transform"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>
        
        {/* Skill Name */}
        <div className="flex-1">
          <span className="font-medium text-text-primary">{skill.name}</span>
          {/* Show base skill info */}
          <span className="ml-2 text-sm text-text-muted">
            ({isAnyBaseSkill ? 'Any Base' : `Base: ${baseSkillName}`})
          </span>
          {/* Warning if base skill will be auto-added */}
          {!hasBaseSkill && !isAnyBaseSkill && (
            <span className="ml-2 text-xs text-amber-600 flex items-center gap-1 inline-flex">
              <AlertCircle className="w-3 h-3" />
              Will add {baseSkillName}
            </span>
          )}
        </div>
        
        {/* Abilities */}
        <div className="flex gap-1">
          {abilities.map(ability => (
            <span 
              key={ability}
              className="px-2 py-0.5 text-xs font-medium rounded bg-surface-alt text-text-secondary capitalize"
            >
              {ability.slice(0, 3).toUpperCase()}
            </span>
          ))}
        </div>
        
        {/* Selection Toggle - uses + for unselected, checkmark for selected */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
            isSelected 
              ? 'bg-primary-600 border-primary-600 text-white' 
              : 'border-border-medium hover:border-primary-400 text-text-muted hover:text-primary-600'
          )}
          aria-label={isSelected ? 'Remove skill' : 'Add skill'}
        >
          {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-2">
          {skill.description && (
            <div className="pl-7 text-sm text-text-secondary bg-surface-alt rounded-lg p-3">
              {skill.description}
            </div>
          )}
        </div>
      )}
      
      {/* Base skill selector for "any base skill" sub-skills */}
      {isAnyBaseSkill && isSelected && onBaseSkillSelect && (
        <div className="mx-3 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="block text-sm font-medium text-blue-800 mb-2">
            Choose which base skill to associate with {skill.name}:
          </label>
          <Select
            value={selectedBaseSkillId || ''}
            onChange={(e) => onBaseSkillSelect(e.target.value)}
            options={[
              { value: '', label: 'Select a base skill...' },
              ...allBaseSkills.map(s => ({ value: s.id, label: s.name }))
            ]}
          />
        </div>
      )}
    </div>
  );
}

export function AddSubSkillModal({
  isOpen,
  onClose,
  characterSkills,
  existingSkillNames,
  onAdd,
}: AddSubSkillModalProps) {
  const { data: allSkills = [], isLoading: loading, error: fetchError } = useRTDBSkills();
  const [searchQuery, setSearchQuery] = useState('');
  const [abilityFilter, setAbilityFilter] = useState('');
  const [baseSkillFilter, setBaseSkillFilter] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<RTDBSkill[]>([]);
  // Track which base skill is selected for "any base skill" sub-skills
  const [anyBaseSkillSelections, setAnyBaseSkillSelections] = useState<Record<string, string>>({});

  // Build a map of skill ID to skill for lookups
  const skillById = useMemo(() => {
    return allSkills.reduce((acc, skill) => {
      acc[skill.id] = skill;
      return acc;
    }, {} as Record<string, RTDBSkill>);
  }, [allSkills]);

  // Get all base skills (no base_skill_id)
  const allBaseSkills = useMemo(() => {
    return allSkills
      .filter(s => s.base_skill_id === undefined)
      .map(s => ({ id: s.id, name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allSkills]);

  // Get character's existing skill names (lowercase for comparison)
  const existingSkillNamesLower = useMemo(() => 
    new Set(existingSkillNames.map(n => n.toLowerCase())),
    [existingSkillNames]
  );

  // Check if character has a base skill (by name or ID)
  const hasBaseSkill = useCallback((baseSkillId: string | number) => {
    const baseSkill = skillById[String(baseSkillId)];
    if (!baseSkill) return false;
    return characterSkills.some(
      cs => cs.name.toLowerCase() === baseSkill.name.toLowerCase() || cs.id === baseSkill.id
    );
  }, [characterSkills, skillById]);

  // Get ALL sub-skills (not just for proficient base skills)
  const allSubSkills = useMemo(() => {
    return allSkills.filter(skill => skill.base_skill_id !== undefined);
  }, [allSkills]);

  // Get unique base skill options for filter
  const baseSkillOptions = useMemo(() => {
    const baseSkillIds = new Set<string>();
    allSubSkills.forEach(skill => {
      if (skill.base_skill_id !== undefined && skill.base_skill_id !== 0) {
        baseSkillIds.add(String(skill.base_skill_id));
      }
    });
    return Array.from(baseSkillIds)
      .map(id => skillById[id])
      .filter(Boolean)
      .map(s => ({ id: s.id, name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allSubSkills, skillById]);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSkills([]);
      setSearchQuery('');
      setAbilityFilter('');
      setBaseSkillFilter('');
      setAnyBaseSkillSelections({});
    }
  }, [isOpen]);

  // Filter sub-skills
  const filteredSkills = useMemo(() => {
    return allSubSkills.filter(skill => {
      // Exclude already owned skills
      if (existingSkillNamesLower.has(skill.name.toLowerCase())) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const baseSkill = skill.base_skill_id ? skillById[String(skill.base_skill_id)] : null;
        const baseSkillName = baseSkill?.name || '';
        if (!skill.name.toLowerCase().includes(query) && 
            !skill.description?.toLowerCase().includes(query) &&
            !baseSkillName.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Ability filter
      if (abilityFilter) {
        const skillAbilities = skill.ability?.split(',').map(a => a.trim().toLowerCase()) || [];
        if (!skillAbilities.includes(abilityFilter.toLowerCase())) {
          return false;
        }
      }
      
      // Base skill filter
      if (baseSkillFilter) {
        if (skill.base_skill_id === 0) return false; // "Any base" doesn't match specific filter
        if (String(skill.base_skill_id) !== baseSkillFilter) return false;
      }
      
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSubSkills, existingSkillNamesLower, searchQuery, abilityFilter, baseSkillFilter, skillById]);

  const toggleSkill = useCallback((skill: RTDBSkill) => {
    setSelectedSkills(prev => {
      const exists = prev.some(s => s.id === skill.id);
      if (exists) {
        return prev.filter(s => s.id !== skill.id);
      } else {
        return [...prev, skill];
      }
    });
  }, []);

  const handleBaseSkillSelect = useCallback((subSkillId: string, baseSkillId: string) => {
    setAnyBaseSkillSelections(prev => ({
      ...prev,
      [subSkillId]: baseSkillId,
    }));
  }, []);

  const handleConfirm = () => {
    if (selectedSkills.length === 0) return;
    
    // Attach selected base skill ID for "any base skill" sub-skills
    // And include any base skills that need to be auto-added
    const skillsWithBase = selectedSkills.map(skill => {
      const isAnyBase = skill.base_skill_id === 0;
      const baseSkillId = isAnyBase 
        ? anyBaseSkillSelections[skill.id] 
        : String(skill.base_skill_id);
      
      // Check if we need to auto-add the base skill
      const needsBaseSkill = baseSkillId && !hasBaseSkill(baseSkillId);
      const autoAddBaseSkill = needsBaseSkill ? skillById[baseSkillId] : undefined;
      
      return {
        ...skill,
        selectedBaseSkillId: isAnyBase ? anyBaseSkillSelections[skill.id] : undefined,
        autoAddBaseSkill,
      };
    });
    
    onAdd(skillsWithBase);
    onClose();
  };

  const error = fetchError?.message || null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light rounded-t-xl bg-gradient-to-r from-primary-50 to-surface">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Add Sub-Skills</h2>
            <p className="text-sm text-text-muted mt-0.5">
              Add specialized skills. Base skill will be added automatically if needed.
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

        {/* Search & Filters */}
        <div className="px-5 py-4 border-b border-border-light bg-surface-alt space-y-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search sub-skills by name, description, or base skill..."
          />
          
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-text-secondary">Ability:</label>
              <select
                value={abilityFilter}
                onChange={(e) => setAbilityFilter(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-border-light bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All</option>
                {ABILITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-text-secondary">Base Skill:</label>
              <select
                value={baseSkillFilter}
                onChange={(e) => setBaseSkillFilter(e.target.value)}
                className="px-3 py-1.5 text-sm rounded-lg border border-border-light bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All</option>
                {baseSkillOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
            
            {/* Results count */}
            <span className="text-sm text-text-muted ml-auto">
              {filteredSkills.length} sub-skill{filteredSkills.length !== 1 ? 's' : ''} available
            </span>
          </div>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 bg-primary-50 border-b border-border-light text-xs font-semibold text-primary-700 uppercase tracking-wider">
          <span className="pl-7">Sub-Skill Name</span>
          <span>Abilities</span>
          <span className="w-6"></span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center py-8">
              <Spinner size="md" className="mx-auto mb-2" />
              <p className="text-text-muted">Loading sub-skills...</p>
            </div>
          )}

          {error && (
            <Alert variant="danger" className="mx-4">
              {error}
            </Alert>
          )}

          {!loading && !error && filteredSkills.length === 0 && (
            <p className="text-center py-8 text-text-muted italic">
              No sub-skills available to add
            </p>
          )}

          {!loading && !error && filteredSkills.length > 0 && (
            <div className="space-y-2">
              {filteredSkills.map(skill => {
                const isAnyBaseSkill = skill.base_skill_id === 0;
                const baseSkill = skill.base_skill_id ? skillById[String(skill.base_skill_id)] : null;
                const baseSkillName = isAnyBaseSkill ? 'Any' : (baseSkill?.name || 'Unknown');
                const characterHasBase = !isAnyBaseSkill && skill.base_skill_id 
                  ? hasBaseSkill(skill.base_skill_id) 
                  : true;
                
                return (
                  <ExpandableSubSkillRow
                    key={skill.id}
                    skill={skill}
                    isSelected={selectedSkills.some(s => s.id === skill.id)}
                    onToggle={() => toggleSkill(skill)}
                    baseSkillName={baseSkillName}
                    isAnyBaseSkill={isAnyBaseSkill}
                    hasBaseSkill={characterHasBase}
                    selectedBaseSkillId={anyBaseSkillSelections[skill.id]}
                    onBaseSkillSelect={isAnyBaseSkill ? (id) => handleBaseSkillSelect(skill.id, id) : undefined}
                    allBaseSkills={allBaseSkills}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border-light bg-surface-alt rounded-b-xl">
          <span className="text-sm text-text-secondary font-medium">
            {selectedSkills.length} sub-skill{selectedSkills.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={selectedSkills.length === 0}
            >
              Add Selected {selectedSkills.length > 0 ? `(${selectedSkills.length})` : ''}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
