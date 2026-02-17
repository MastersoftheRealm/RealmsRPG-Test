/**
 * Add Skill Modal
 * ===============
 * Shared modal for adding base skills from Codex.
 * Used by: character sheet, character creator (SkillsAllocationPage).
 * Features:
 * - Matches Codex skills page design
 * - Ability filter (dropdown)
 * - Uses GridListRow for consistent UI
 * - Fully rounded edges
 * - Header with title and skill count
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Spinner, SearchInput, IconButton, Alert, Button, Modal } from '@/components/ui';
import { GridListRow, ListHeader } from '@/components/shared';
import { useSort } from '@/hooks/use-sort';
import { useCodexSkills, type Skill } from '@/hooks';
import { ABILITY_FILTER_OPTIONS } from '@/lib/constants/skills';
import { getSkillExtraDescriptionDetailSections } from '@/lib/skill-extra-descriptions';
import { X } from 'lucide-react';

export interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSkillNames: string[];
  onAdd: (skills: Skill[]) => void;
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
  const { data: allSkills = [], isLoading: loading, error: queryError } = useCodexSkills();
  const [searchQuery, setSearchQuery] = useState('');
  const [abilityFilter, setAbilityFilter] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const { sortState, handleSort, sortItems } = useSort('name');

  // Filter to base skills only (no base_skill_id = not a sub-skill)
  const skills = useMemo(() => {
    return allSkills.filter((s: Skill) => s.base_skill_id === undefined);
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

    return skills.filter((skill: Skill) => {
      const nameLower = String(skill.name ?? '').toLowerCase();
      // Exclude already owned skills
      if (existingLower.includes(nameLower)) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!nameLower.includes(query) &&
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

  const sortedSkills = useMemo(
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
              {sortedSkills.map((skill: Skill & { ability: string }) => {
                const extraSections = getSkillExtraDescriptionDetailSections(skill);
                return (
                  <GridListRow
                    key={skill.id}
                    id={skill.id}
                    name={skill.name}
                    description={skill.description}
                    detailSections={extraSections.length > 0 ? extraSections : undefined}
                    badges={formatAbilityBadges(skill.ability)}
                    selectable
                    isSelected={selectedSkills.some(s => s.id === skill.id)}
                    onSelect={() => toggleSkill(skill)}
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
