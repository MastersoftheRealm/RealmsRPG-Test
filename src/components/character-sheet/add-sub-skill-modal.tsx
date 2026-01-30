/**
 * Add Sub-Skill Modal
 * ===================
 * Modal for adding sub-skills from RTDB
 * Only shows sub-skills where the character has proficiency in the base skill
 * Uses unified GridListRow component for consistent styling.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { ref, get } from 'firebase/database';
import { rtdb } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';
import { X, Search } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { GridListRow } from '@/components/shared';

interface SubSkill {
  id: string;
  name: string;
  ability?: string[];
  description?: string;
  base_skill: string;
}

interface CharacterSkill {
  name: string;
  prof?: boolean;
}

interface AddSubSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterSkills: CharacterSkill[];
  existingSkillNames: string[];
  onAdd: (skills: SubSkill[]) => void;
}

function SubSkillRow({
  skill,
  isSelected,
  onToggle,
}: {
  skill: SubSkill;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const abilityStr = Array.isArray(skill.ability) ? skill.ability.join(', ') : '';

  // Build columns for base skill and ability info
  const columns = [
    { key: 'Base', value: skill.base_skill },
    ...(abilityStr ? [{ key: 'Ability', value: abilityStr }] : []),
  ];

  return (
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
  );
}

export function AddSubSkillModal({
  isOpen,
  onClose,
  characterSkills,
  existingSkillNames,
  onAdd,
}: AddSubSkillModalProps) {
  const [subSkills, setSubSkills] = useState<SubSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<SubSkill[]>([]);

  // Get proficient base skill names
  const proficientBaseSkills = useMemo(() => {
    return characterSkills
      .filter(s => s.prof)
      .map(s => s.name);
  }, [characterSkills]);

  // Load sub-skills from RTDB
  useEffect(() => {
    if (!isOpen) return;
    
    const loadSubSkills = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const snapshot = await get(ref(rtdb, 'skills'));
        if (snapshot.exists()) {
          const data = snapshot.val();
          // Only get sub-skills (have base_skill property) where base is proficient
          const skillList = Object.entries(data)
            .map(([id, skill]) => ({
              id,
              ...(skill as Omit<SubSkill, 'id'>),
            }))
            .filter(s => s.base_skill && proficientBaseSkills.includes(s.base_skill));
          
          setSubSkills(skillList);
        }
      } catch (e) {
        setError(`Failed to load sub-skills: ${e instanceof Error ? e.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadSubSkills();
  }, [isOpen, proficientBaseSkills]);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSkills([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter sub-skills
  const filteredSkills = useMemo(() => {
    const existingLower = existingSkillNames.map(n => n.toLowerCase());
    
    return subSkills.filter(skill => {
      // Exclude already owned skills
      if (existingLower.includes(skill.name.toLowerCase())) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!skill.name.toLowerCase().includes(query) && 
            !skill.base_skill.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [subSkills, existingSkillNames, searchQuery]);

  const toggleSkill = (skill: SubSkill) => {
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <h2 className="text-lg font-bold text-text-primary">Add Sub-Skill</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Info */}
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-700">
            Sub-skills are available for skills you are proficient in.
          </p>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-neutral-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sub-skills..."
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
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
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
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
              {filteredSkills.map(skill => (
                <SubSkillRow
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
          <span className="text-sm text-text-muted">
            {selectedSkills.length} sub-skill{selectedSkills.length !== 1 ? 's' : ''} selected
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
