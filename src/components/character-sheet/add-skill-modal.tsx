/**
 * Add Skill Modal
 * ===============
 * Modal for adding base skills from RTDB
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { ref, get } from 'firebase/database';
import { rtdb } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';
import { X, Search } from 'lucide-react';

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

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2 border rounded-lg transition-all',
        isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center transition-colors',
            isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          )}
        >
          {isSelected ? '✓' : '+'}
        </button>
        <div>
          <span className="font-medium text-gray-800">{skill.name}</span>
          {abilityStr && (
            <span className="ml-2 text-xs text-gray-500">({abilityStr})</span>
          )}
        </div>
      </div>
      {skill.category && (
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
          {skill.category}
        </span>
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Add Skill</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading skills...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && filteredSkills.length === 0 && (
            <p className="text-center py-8 text-gray-500 italic">
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <span className="text-sm text-gray-500">
            {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
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
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
