/**
 * Add Sub-Skill Modal
 * ===================
 * Modal for adding sub-skills from RTDB
 * Only shows sub-skills where the character has proficiency in the base skill
 * Uses unified GridListRow component for consistent styling.
 * Now uses ID-based base_skill lookups (base_skill_id = 0 means "any base skill")
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Spinner, SearchInput, IconButton, Alert, Select } from '@/components/ui';
import { GridListRow } from '@/components/shared';
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
  onAdd: (skills: Array<RTDBSkill & { selectedBaseSkillId?: string }>) => void;
}

function SubSkillRow({
  skill,
  isSelected,
  onToggle,
  baseSkillName,
  isAnyBaseSkill,
  selectedBaseSkillId,
  onBaseSkillSelect,
  proficientSkills,
}: {
  skill: RTDBSkill;
  isSelected: boolean;
  onToggle: () => void;
  baseSkillName: string;
  isAnyBaseSkill: boolean;
  selectedBaseSkillId?: string;
  onBaseSkillSelect?: (skillId: string) => void;
  proficientSkills: Array<{ id: string; name: string }>;
}) {
  const abilityStr = skill.ability || '';

  // Build columns for base skill and ability info
  const columns = [
    { key: 'Base', value: isAnyBaseSkill ? 'Any' : baseSkillName },
    ...(abilityStr ? [{ key: 'Ability', value: abilityStr }] : []),
  ];

  return (
    <div className="space-y-2">
      <GridListRow
        id={skill.id}
        name={skill.name}
        description={skill.description}
        columns={columns}
        selectable
        isSelected={isSelected}
        onSelect={onToggle}
        compact
      />
      {/* If "any base skill" and selected, show dropdown to pick which base skill */}
      {isAnyBaseSkill && isSelected && onBaseSkillSelect && (
        <div className="ml-6 p-2 bg-surface-alt rounded border border-border-light">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Choose base skill for {skill.name}:
          </label>
          <Select
            value={selectedBaseSkillId || ''}
            onChange={(e) => onBaseSkillSelect(e.target.value)}
            options={[
              { value: '', label: 'Select a base skill...' },
              ...proficientSkills.map(s => ({ value: s.id, label: s.name }))
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
  const { data: allSkills, isLoading: loading, error: fetchError } = useRTDBSkills();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<RTDBSkill[]>([]);
  // Track which base skill is selected for "any base skill" sub-skills
  const [anyBaseSkillSelections, setAnyBaseSkillSelections] = useState<Record<string, string>>({});

  // Build a map of skill ID to skill for lookups
  const skillById = useMemo(() => {
    if (!allSkills) return {};
    return allSkills.reduce((acc, skill) => {
      acc[skill.id] = skill;
      return acc;
    }, {} as Record<string, RTDBSkill>);
  }, [allSkills]);

  // Get proficient base skills (with IDs)
  const proficientBaseSkills = useMemo(() => {
    if (!allSkills) return [];
    
    return characterSkills
      .filter(s => s.prof)
      .map(charSkill => {
        // Find the RTDB skill by name or ID
        const rtdbSkill = allSkills.find(
          s => s.name.toLowerCase() === charSkill.name.toLowerCase() || s.id === charSkill.id
        );
        return rtdbSkill ? { id: rtdbSkill.id, name: rtdbSkill.name } : null;
      })
      .filter((s): s is { id: string; name: string } => s !== null);
  }, [characterSkills, allSkills]);

  const proficientSkillIds = useMemo(() => 
    new Set(proficientBaseSkills.map(s => s.id)), 
    [proficientBaseSkills]
  );

  // Get sub-skills that the user can add
  const availableSubSkills = useMemo(() => {
    if (!allSkills) return [];
    
    return allSkills.filter(skill => {
      // Must be a sub-skill (has base_skill_id)
      if (skill.base_skill_id === undefined) return false;
      
      // base_skill_id = 0 means any base skill - just need at least one proficient skill
      if (skill.base_skill_id === 0) {
        return proficientBaseSkills.length > 0;
      }
      
      // Otherwise, check if the specific base skill is proficient
      return proficientSkillIds.has(String(skill.base_skill_id));
    });
  }, [allSkills, proficientBaseSkills, proficientSkillIds]);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSkills([]);
      setSearchQuery('');
      setAnyBaseSkillSelections({});
    }
  }, [isOpen]);

  // Filter sub-skills
  const filteredSkills = useMemo(() => {
    const existingLower = existingSkillNames.map(n => n.toLowerCase());
    
    return availableSubSkills.filter(skill => {
      // Exclude already owned skills
      if (existingLower.includes(skill.name.toLowerCase())) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const baseSkill = skill.base_skill_id ? skillById[String(skill.base_skill_id)] : null;
        const baseSkillName = baseSkill?.name || '';
        if (!skill.name.toLowerCase().includes(query) && 
            !baseSkillName.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [availableSubSkills, existingSkillNames, searchQuery, skillById]);

  const toggleSkill = (skill: RTDBSkill) => {
    setSelectedSkills(prev => {
      const exists = prev.some(s => s.id === skill.id);
      if (exists) {
        return prev.filter(s => s.id !== skill.id);
      } else {
        return [...prev, skill];
      }
    });
  };

  const handleBaseSkillSelect = (subSkillId: string, baseSkillId: string) => {
    setAnyBaseSkillSelections(prev => ({
      ...prev,
      [subSkillId]: baseSkillId,
    }));
  };

  const handleConfirm = () => {
    if (selectedSkills.length > 0) {
      // Attach selected base skill ID for "any base skill" sub-skills
      const skillsWithBase = selectedSkills.map(skill => ({
        ...skill,
        selectedBaseSkillId: skill.base_skill_id === 0 
          ? anyBaseSkillSelections[skill.id] 
          : undefined,
      }));
      onAdd(skillsWithBase);
      onClose();
    }
  };

  const error = fetchError?.message || null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
          <h2 className="text-lg font-bold text-text-primary">Add Sub-Skill</h2>
          <IconButton
            label="Close modal"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        {/* Info */}
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-700">
            Sub-skills are available for skills you are proficient in.
          </p>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border-subtle">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search sub-skills..."
            size="sm"
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

          {!loading && !error && proficientBaseSkills.length === 0 && (
            <p className="text-center py-8 text-text-muted italic">
              You need at least one proficient skill to add sub-skills.
            </p>
          )}

          {!loading && !error && proficientBaseSkills.length > 0 && filteredSkills.length === 0 && (
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
                
                return (
                  <SubSkillRow
                    key={skill.id}
                    skill={skill}
                    isSelected={selectedSkills.some(s => s.id === skill.id)}
                    onToggle={() => toggleSkill(skill)}
                    baseSkillName={baseSkillName}
                    isAnyBaseSkill={isAnyBaseSkill}
                    selectedBaseSkillId={anyBaseSkillSelections[skill.id]}
                    onBaseSkillSelect={isAnyBaseSkill ? (id) => handleBaseSkillSelect(skill.id, id) : undefined}
                    proficientSkills={proficientBaseSkills}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-light bg-surface-alt">
          <span className="text-sm text-text-muted">
            {selectedSkills.length} sub-skill{selectedSkills.length !== 1 ? 's' : ''} selected
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
              disabled={selectedSkills.length === 0}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-colors',
                selectedSkills.length > 0
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-surface text-text-muted cursor-not-allowed'
              )}
            >
              Add {selectedSkills.length > 0 ? `(${selectedSkills.length})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
