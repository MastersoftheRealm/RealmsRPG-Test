/**
 * Add Skill Modal
 * ===============
 * Modal for adding base skills from RTDB
 * Features:
 * - Matches Codex skills page design
 * - Ability filter (dropdown)
 * - Expandable skill rows with descriptions
 * - Fully rounded edges
 * - Header with title and skill count
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { Spinner, SearchInput, IconButton, Alert, Button } from '@/components/ui';
import { useRTDBSkills, type RTDBSkill } from '@/hooks';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSkillNames: string[];
  onAdd: (skills: RTDBSkill[]) => void;
}

const ABILITY_OPTIONS = [
  { value: 'strength', label: 'Strength' },
  { value: 'vitality', label: 'Vitality' },
  { value: 'agility', label: 'Agility' },
  { value: 'acuity', label: 'Acuity' },
  { value: 'intelligence', label: 'Intelligence' },
  { value: 'charisma', label: 'Charisma' },
];

function ExpandableSkillRow({
  skill,
  isSelected,
  onToggle,
}: {
  skill: RTDBSkill;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Format abilities for display
  const abilities = skill.ability?.split(',').map(a => a.trim()).filter(Boolean) || [];
  
  return (
    <div className={cn(
      'border rounded-lg transition-colors',
      isSelected ? 'border-primary-400 bg-primary-50' : 'border-border-light hover:border-border-medium'
    )}>
      {/* Header Row */}
      <div className="flex items-center gap-3 p-3">
        {/* Expand Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-text-muted hover:text-text-primary transition-colors"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        {/* Skill Name */}
        <span className="font-medium text-text-primary flex-1">{skill.name}</span>
        
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
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
            isSelected 
              ? 'bg-primary-600 border-primary-600 text-white' 
              : 'border-border-medium hover:border-primary-400'
          )}
          aria-label={isSelected ? 'Deselect skill' : 'Select skill'}
        >
          {isSelected && <Check className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Expanded Description */}
      {isExpanded && skill.description && (
        <div className="px-3 pb-3 pt-0">
          <div className="pl-7 text-sm text-text-secondary bg-surface-alt rounded-lg p-3">
            {skill.description}
          </div>
        </div>
      )}
    </div>
  );
}

export function AddSkillModal({
  isOpen,
  onClose,
  existingSkillNames,
  onAdd,
}: AddSkillModalProps) {
  const { data: allSkills = [], isLoading: loading, error: queryError } = useRTDBSkills();
  const [searchQuery, setSearchQuery] = useState('');
  const [abilityFilter, setAbilityFilter] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<RTDBSkill[]>([]);

  // Filter to base skills only (no base_skill_id = not a sub-skill)
  const skills = useMemo(() => {
    return allSkills.filter(s => s.base_skill_id === undefined);
  }, [allSkills]);

  const error = queryError ? `Failed to load skills: ${queryError.message}` : null;

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSkills([]);
      setSearchQuery('');
      setAbilityFilter('');
    }
  }, [isOpen]);

  // Filter skills
  const filteredSkills = useMemo(() => {
    const existingLower = existingSkillNames.map(n => n.toLowerCase());
    
    return skills.filter(skill => {
      // Exclude already owned skills
      if (existingLower.includes(skill.name.toLowerCase())) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!skill.name.toLowerCase().includes(query) && 
            !skill.description?.toLowerCase().includes(query)) {
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
      
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [skills, existingSkillNames, searchQuery, abilityFilter]);

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

  const handleConfirm = () => {
    if (selectedSkills.length > 0) {
      onAdd(selectedSkills);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light rounded-t-xl bg-surface-alt">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Add Skills</h2>
            <p className="text-sm text-text-muted mt-0.5">
              Select skills to add to your character
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
        <div className="px-5 py-4 border-b border-border-subtle space-y-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search skills by name or description..."
          />
          
          <div className="flex gap-3 items-center">
            <label className="text-sm font-medium text-text-secondary">Filter by Ability:</label>
            <select
              value={abilityFilter}
              onChange={(e) => setAbilityFilter(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-border-light bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Abilities</option>
              {ABILITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            
            {/* Results count */}
            <span className="text-sm text-text-muted ml-auto">
              {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''} available
            </span>
          </div>
        </div>

        {/* Column Headers */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2 bg-surface-alt border-b border-border-light text-xs font-semibold text-text-muted uppercase tracking-wider">
          <span className="pl-7">Skill Name</span>
          <span>Abilities</span>
          <span className="w-6"></span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center py-8">
              <Spinner size="md" className="mx-auto mb-2" />
              <p className="text-text-muted">Loading skills...</p>
            </div>
          )}

          {error && (
            <Alert variant="danger" className="mx-4">
              {error}
            </Alert>
          )}

          {!loading && !error && filteredSkills.length === 0 && (
            <p className="text-center py-8 text-text-muted italic">
              No skills available to add
            </p>
          )}

          {!loading && !error && filteredSkills.length > 0 && (
            <div className="space-y-2">
              {filteredSkills.map(skill => (
                <ExpandableSkillRow
                  key={skill.id}
                  skill={skill}
                  isSelected={selectedSkills.some(s => s.id === skill.id)}
                  onToggle={() => toggleSkill(skill)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-border-light bg-surface-alt rounded-b-xl">
          <span className="text-sm text-text-secondary font-medium">
            {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected
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
