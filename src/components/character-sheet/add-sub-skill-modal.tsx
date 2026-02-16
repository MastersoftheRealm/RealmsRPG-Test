/**
 * Add Sub-Skill Modal
 * ===================
 * Modal for adding sub-skills from Codex
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
import { X, AlertCircle } from 'lucide-react';
import { Spinner, SearchInput, IconButton, Alert, Button, Select, Modal } from '@/components/ui';
import { SelectionToggle, ListHeader } from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import { useCodexSkills, type Skill } from '@/hooks';
import { ABILITY_FILTER_OPTIONS } from '@/lib/constants/skills';
import { getSkillExtraDescriptionDetailSections } from '@/lib/skill-extra-descriptions';

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
  onAdd: (skills: Array<Skill & { selectedBaseSkillId?: string; autoAddBaseSkill?: Skill }>) => void;
}

/** Expandable chips for skill extra descriptions (Success Outcomes, DS Calculation, etc.) */
function SkillExtraChipsSection({
  label,
  chips,
}: {
  label: string;
  chips: Array<{ name: string; description?: string; category?: string }>;
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  return (
    <div className="pl-7 space-y-2">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</h4>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const isExpanded = expandedKey === chip.name;
          const isExpandable = !!chip.description;
          return (
            <button
              key={chip.name}
              type="button"
              onClick={() => setExpandedKey(isExpandable ? (isExpanded ? null : chip.name) : null)}
              className={cn(
                'inline-flex flex-col items-start rounded-xl text-sm font-medium transition-all duration-200 border px-3 py-1.5',
                isExpandable ? 'cursor-pointer border-primary-200 bg-primary-50/50 hover:bg-primary-50' : 'cursor-default border-border-light bg-surface-alt',
                isExpanded ? 'w-full ring-2 ring-offset-1 ring-primary-500' : ''
              )}
            >
              <span>{chip.name}</span>
              {isExpanded && chip.description && (
                <span className="block mt-1.5 pt-1.5 border-t border-current/15 text-xs font-normal text-left opacity-90 leading-relaxed">
                  {chip.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  skill: Skill;
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
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-surface-alt/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Skill Name */}
        <div className="flex-1">
          <span className="font-medium text-text-primary">{skill.name}</span>
          {/* Show base skill info */}
          <span className="ml-2 text-sm text-text-muted">
            ({isAnyBaseSkill ? 'Any Base' : `Base: ${baseSkillName}`})
          </span>
          {/* Warning if base skill will be auto-added */}
          {!hasBaseSkill && !isAnyBaseSkill && (
            <span className="ml-2 text-xs text-warning-600 dark:text-warning-400 flex items-center gap-1 inline-flex">
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
        
        {/* Selection Toggle */}
        <SelectionToggle
          isSelected={isSelected}
          onToggle={onToggle}
          size="sm"
          label={isSelected ? 'Remove skill' : 'Add skill'}
        />
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-2">
          {skill.description && (
            <div className="pl-7 text-sm text-text-secondary bg-surface-alt rounded-lg p-3">
              {skill.description}
            </div>
          )}
          {getSkillExtraDescriptionDetailSections(skill)
            .filter((s) => s.chips.length > 0)
            .map((section) => (
              <SkillExtraChipsSection key={section.label} label={section.label} chips={section.chips} />
            ))}
        </div>
      )}
      
      {/* Base skill selector for "any base skill" sub-skills */}
      {isAnyBaseSkill && isSelected && onBaseSkillSelect && (
        <div className="mx-3 mb-3 p-3 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-600/50 rounded-lg">
          <label className="block text-sm font-medium text-primary-800 dark:text-primary-300 mb-2">
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
  const { data: allSkills = [], isLoading: loading, error: fetchError } = useCodexSkills();
  const [searchQuery, setSearchQuery] = useState('');
  const [abilityFilter, setAbilityFilter] = useState('');
  const [baseSkillFilter, setBaseSkillFilter] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const { sortState, handleSort, sortItems } = useSort('name');
  // Track which base skill is selected for "any base skill" sub-skills
  const [anyBaseSkillSelections, setAnyBaseSkillSelections] = useState<Record<string, string>>({});

  // Build a map of skill ID to skill for lookups
  const skillById = useMemo(() => {
    return allSkills.reduce((acc: Record<string, Skill>, skill: Skill) => {
      acc[skill.id] = skill;
      return acc;
    }, {} as Record<string, Skill>);
  }, [allSkills]);

  // Get all base skills (no base_skill_id)
  const allBaseSkills = useMemo(() => {
    return allSkills
      .filter((s: Skill) => s.base_skill_id === undefined)
      .map((s: Skill) => ({ id: s.id, name: s.name }))
      .sort((a: { id: string; name: string }, b: { id: string; name: string }) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
  }, [allSkills]);

  // Get character's existing skill names (lowercase for comparison)
  const existingSkillNamesLower = useMemo(() => 
    new Set(existingSkillNames.map(n => String(n ?? '').toLowerCase())),
    [existingSkillNames]
  );

  // Check if character has a base skill (by name or ID)
  const hasBaseSkill = useCallback((baseSkillId: string | number) => {
    const baseSkill = skillById[String(baseSkillId)];
    if (!baseSkill) return false;
    return characterSkills.some(
      cs => String(cs.name ?? '').toLowerCase() === String(baseSkill.name ?? '').toLowerCase() || cs.id === baseSkill.id
    );
  }, [characterSkills, skillById]);

  // Get ALL sub-skills (not just for proficient base skills)
  const allSubSkills = useMemo(() => {
    return allSkills.filter((skill: Skill) => skill.base_skill_id !== undefined);
  }, [allSkills]);

  // Get unique base skill options for filter
  const baseSkillOptions = useMemo(() => {
    const baseSkillIds = new Set<string>();
    allSubSkills.forEach((skill: Skill) => {
      if (skill.base_skill_id !== undefined && skill.base_skill_id !== 0) {
        baseSkillIds.add(String(skill.base_skill_id));
      }
    });
    return Array.from(baseSkillIds)
      .map(id => skillById[id])
      .filter(Boolean)
      .map(s => ({ id: s.id, name: s.name }))
      .sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
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
    return allSubSkills.filter((skill: Skill) => {
      const nameLower = String(skill.name ?? '').toLowerCase();
      // Exclude already owned skills
      if (existingSkillNamesLower.has(nameLower)) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const baseSkill = skill.base_skill_id ? skillById[String(skill.base_skill_id)] : null;
        const baseSkillName = baseSkill?.name || '';
        if (!nameLower.includes(query) && 
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
    });
  }, [allSubSkills, existingSkillNamesLower, searchQuery, abilityFilter, baseSkillFilter, skillById]);

  const sortedSubSkills = useMemo(
    () => sortItems<Skill & { ability: string }>(filteredSkills.map((s: Skill) => ({ ...s, ability: s.ability || '' }))),
    [filteredSkills, sortItems]
  );

  const toggleSkill = useCallback((skill: Skill) => {
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

  // Custom header for Modal
  const modalHeader = (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border-light bg-gradient-to-r from-primary-50 to-surface">
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
  );

  // Custom footer for Modal
  const modalFooter = (
    <div className="flex items-center justify-between px-5 py-4 border-t border-border-light bg-surface-alt">
      {selectedSkills.length > 0 ? (
        <span className="text-sm text-text-secondary font-medium">
          {selectedSkills.length} selected
        </span>
      ) : (
        <span></span>
      )}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={selectedSkills.length === 0}
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
      size="xl"
      header={modalHeader}
      footer={modalFooter}
      showCloseButton={false}
      flexLayout
      contentClassName=""
      className="max-h-[85vh]"
    >

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
                {ABILITY_FILTER_OPTIONS.map(opt => (
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
          </div>
        </div>

        {/* Column Headers — ListHeader with sort */}
        <div className="px-5">
          <ListHeader
            columns={[
              { key: 'name', label: 'Name', width: '1fr' },
              { key: 'ability', label: 'Abilities', width: 'auto', align: 'center' },
            ]}
            gridColumns="1fr auto"
            sortState={sortState}
            onSort={handleSort}
            hasSelectionColumn
            className="mx-0"
          />
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

          {!loading && !error && sortedSubSkills.length > 0 && (
            <div className="space-y-2">
              {sortedSubSkills.map(skill => {
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
      </Modal>
  );
}
