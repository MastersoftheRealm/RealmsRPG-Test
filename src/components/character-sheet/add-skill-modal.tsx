/**
 * Add Skill Modal
 * ===============
 * Modal for adding base skills from RTDB
 * Uses unified GridListRow component for consistent styling.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { ref, get } from 'firebase/database';
import { rtdb } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Spinner, SearchInput, IconButton, Alert } from '@/components/ui';
import { GridListRow } from '@/components/shared';

interface Skill {
  id: string;
  name: string;
  ability?: string[];
  description?: string;
  category?: string;
  base_skill?: string | null;
}

interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSkillNames: string[];
  onAdd: (skills: Skill[]) => void;
}

function SkillRow({
  skill,
  isSelected,
  onToggle,
}: {
  skill: Skill;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const abilityStr = Array.isArray(skill.ability) ? skill.ability.join(', ') : '';

  // Build badges from category
  const badges: Array<{ label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' }> = [];
  if (skill.category) {
    badges.push({ label: skill.category, color: 'gray' });
  }

  // Build columns for ability info
  const columns = abilityStr ? [{ key: 'Ability', value: abilityStr }] : [];

  return (
    <GridListRow
      id={skill.id}
      name={skill.name}
      description={skill.description}
      columns={columns}
      badges={badges}
      selectable
      isSelected={isSelected}
      onSelect={onToggle}
      compact
    />
  );
}

export function AddSkillModal({
  isOpen,
  onClose,
  existingSkillNames,
  onAdd,
}: AddSkillModalProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);

  // Load skills from RTDB
  useEffect(() => {
    if (!isOpen) return;
    
    const loadSkills = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const snapshot = await get(ref(rtdb, 'skills'));
        if (snapshot.exists()) {
          const data = snapshot.val();
          // Only get base skills (no base_skill property)
          const skillList = Object.entries(data)
            .map(([id, skill]) => ({
              id,
              ...(skill as Omit<Skill, 'id'>),
            }))
            .filter(s => !s.base_skill); // Filter to base skills only
          
          setSkills(skillList);
        }
      } catch (e) {
        setError(`Failed to load skills: ${e instanceof Error ? e.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [isOpen]);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSkills([]);
      setSearchQuery('');
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
        if (!skill.name.toLowerCase().includes(query)) return false;
      }
      
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [skills, existingSkillNames, searchQuery]);

  const toggleSkill = (skill: Skill) => {
    setSelectedSkills(prev => {
      const exists = prev.some(s => s.id === skill.id);
      if (exists) {
        return prev.filter(s => s.id !== skill.id);
      } else {
        return [...prev, skill];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedSkills.length > 0) {
      onAdd(selectedSkills);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
          <h2 className="text-lg font-bold text-text-primary">Add Skill</h2>
          <IconButton
            label="Close modal"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border-subtle">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search skills..."
            size="sm"
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

          {!loading && !error && filteredSkills.length > 0 && (
            <div className="space-y-2">
              {filteredSkills.map(skill => (
                <SkillRow
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-light bg-surface-alt">
          <span className="text-sm text-text-muted">
            {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-text-secondary hover:bg-neutral-200 transition-colors"
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
                  : 'bg-neutral-200 text-text-muted cursor-not-allowed'
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
