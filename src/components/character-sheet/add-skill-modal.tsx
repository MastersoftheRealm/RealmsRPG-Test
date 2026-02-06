/**
 * Add Skill Modal
 * ===============
 * Modal for adding base skills from RTDB
 * Features:
 * - Matches Codex skills page design
 * - Ability filter (dropdown)
 * - Uses GridListRow for consistent UI (Phase 3: Modal Unification)
 * - Fully rounded edges
 * - Header with title and skill count
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Spinner, SearchInput, IconButton, Alert, Button, Modal } from '@/components/ui';
import { GridListRow, ListHeader, type SortState } from '@/components/shared';
import { useRTDBSkills, type RTDBSkill } from '@/hooks';
import { ABILITY_FILTER_OPTIONS } from '@/lib/constants/skills';

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSkillNames: string[];
  onAdd: (skills: RTDBSkill[]) => void;
}

// Helper to format ability badges for GridListRow
function formatAbilityBadges(abilityString?: string): Array<{ label: string; color: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' }> {
  if (!abilityString) return [];
  return abilityString.split(',').map(a => a.trim()).filter(Boolean).map(ability => ({
    label: ability.slice(0, 3).toUpperCase(),
    color: 'gray' as const
  }));
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
  const [sortState, setSortState] = useState<SortState>({ col: 'name', dir: 1 });

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
    });
  }, [skills, existingSkillNames, searchQuery, abilityFilter]);

  const toggleSort = useCallback((current: SortState, col: string): SortState => {
    if (current.col === col) return { col, dir: current.dir === 1 ? -1 : 1 };
    return { col, dir: 1 };
  }, []);

  const sortedSkills = useMemo(() => {
    const sorted = [...filteredSkills];
    const mult = sortState.dir;
    if (sortState.col === 'name') {
      sorted.sort((a, b) => mult * a.name.localeCompare(b.name));
    } else if (sortState.col === 'ability') {
      sorted.sort((a, b) => {
        const aa = a.ability || '';
        const bb = b.ability || '';
        return mult * aa.localeCompare(bb);
      });
    }
    return sorted;
  }, [filteredSkills, sortState]);

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

  // Custom header for Modal
  const modalHeader = (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border-light bg-gradient-to-r from-primary-50 to-surface">
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
  );

  // Custom footer for Modal
  const modalFooter = (
    <div className="flex items-center justify-between px-5 py-4 border-t border-border-light bg-surface-alt">
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
              {ABILITY_FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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
            onSort={(col) => setSortState(prev => toggleSort(prev, col))}
            hasSelectionColumn
            className="mx-0"
          />
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

          {!loading && !error && sortedSkills.length > 0 && (
            <div className="space-y-2 mt-2">
              {sortedSkills.map(skill => (
                <GridListRow
                  key={skill.id}
                  id={skill.id}
                  name={skill.name}
                  description={skill.description}
                  badges={formatAbilityBadges(skill.ability)}
                  selectable
                  isSelected={selectedSkills.some(s => s.id === skill.id)}
                  onSelect={() => toggleSkill(skill)}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      </Modal>
  );
}
