/**
 * Skills Step
 * ============
 * Allocate skill points with real data from Firebase RTDB
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useRTDBSkills, type RTDBSkill } from '@/hooks';
import { calculateSkillPoints } from '@/lib/game/formulas';

const ABILITY_ORDER = ['Strength', 'Vitality', 'Agility', 'Acuity', 'Intelligence', 'Charisma'];

export function SkillsStep() {
  const { draft, nextStep, prevStep, updateDraft } = useCharacterCreatorStore();
  const { data: skills, isLoading } = useRTDBSkills();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Get skill points based on level (default level 1)
  const totalSkillPoints = calculateSkillPoints(draft.level || 1);
  
  // Initialize skill allocations from draft or create empty
  // CharacterSkills is Record<string, number>
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    return draft.skills || {};
  });

  const usedPoints = useMemo(() => {
    return Object.values(allocations).reduce((sum, val) => sum + val, 0);
  }, [allocations]);

  const remainingPoints = totalSkillPoints - usedPoints;

  // Group skills by ability/category
  const groupedSkills = useMemo(() => {
    if (!skills) return {};
    const groups: Record<string, RTDBSkill[]> = {};
    
    skills.forEach(skill => {
      const category = skill.ability || skill.category || 'General';
      if (!groups[category]) groups[category] = [];
      groups[category].push(skill);
    });
    
    // Sort by ability order
    const sorted: Record<string, RTDBSkill[]> = {};
    ABILITY_ORDER.forEach(ability => {
      if (groups[ability]) sorted[ability] = groups[ability];
    });
    Object.keys(groups)
      .filter(k => !ABILITY_ORDER.includes(k))
      .forEach(k => { sorted[k] = groups[k]; });
    
    return sorted;
  }, [skills]);

  const handleAllocate = useCallback((skillId: string, delta: number) => {
    setAllocations(prev => {
      const current = prev[skillId] || 0;
      const newValue = Math.max(0, current + delta);
      
      // Can't exceed remaining points when adding
      if (delta > 0 && remainingPoints <= 0) return prev;
      
      if (newValue === 0) {
        const { [skillId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [skillId]: newValue };
    });
  }, [remainingPoints]);

  const handleContinue = () => {
    // Save allocations to draft - CharacterSkills is just Record<string, number>
    updateDraft({
      skills: allocations,
    });
    nextStep();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Allocate Skills</h1>
          <p className="text-gray-600">
            Distribute your skill points to define your character&apos;s trained abilities.
          </p>
        </div>
        
        {/* Points Counter */}
        <div className={cn(
          'px-4 py-2 rounded-xl font-bold text-lg',
          remainingPoints > 0 ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
        )}>
          {remainingPoints} / {totalSkillPoints} Points
        </div>
      </div>
      
      {/* Skills by Category */}
      <div className="space-y-4 mb-8">
        {Object.entries(groupedSkills).map(([category, categorySkills]) => {
          const categoryPoints = categorySkills.reduce(
            (sum, s) => sum + (allocations[s.id] || 0), 0
          );
          const isExpanded = expandedCategory === category || expandedCategory === null;
          
          return (
            <div key={category} className="bg-white rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => setExpandedCategory(
                  expandedCategory === category ? null : category
                )}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-gray-900">{category}</h3>
                  <span className="text-sm text-gray-500">
                    {categorySkills.length} skills
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {categoryPoints > 0 && (
                    <span className="px-2 py-0.5 text-sm bg-primary-100 text-primary-700 rounded">
                      {categoryPoints} pts
                    </span>
                  )}
                  <span className={cn(
                    'transition-transform',
                    isExpanded && 'rotate-180'
                  )}>
                    ▼
                  </span>
                </div>
              </button>
              
              {isExpanded && (
                <div className="p-4 grid md:grid-cols-2 gap-3">
                  {categorySkills.map(skill => (
                    <SkillAllocator
                      key={skill.id}
                      skill={skill}
                      value={allocations[skill.id] || 0}
                      onAllocate={(delta) => handleAllocate(skill.id, delta)}
                      canIncrease={remainingPoints > 0}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {(!skills || skills.length === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
          <p className="text-amber-700 text-center">
            No skill data available. Please check Firebase connection.
          </p>
        </div>
      )}
      
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100"
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          className="px-8 py-3 rounded-xl font-bold bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

interface SkillAllocatorProps {
  skill: RTDBSkill;
  value: number;
  onAllocate: (delta: number) => void;
  canIncrease: boolean;
}

function SkillAllocator({ skill, value, onAllocate, canIncrease }: SkillAllocatorProps) {
  const [showDescription, setShowDescription] = useState(false);
  
  return (
    <div className={cn(
      'p-3 rounded-lg border transition-colors',
      value > 0 ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-200'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ℹ️
          </button>
          <span className="font-medium text-gray-900">{skill.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAllocate(-1)}
            disabled={value === 0}
            className={cn(
              'w-7 h-7 rounded flex items-center justify-center font-bold',
              value > 0
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            )}
          >
            −
          </button>
          
          <span className={cn(
            'w-8 text-center font-bold',
            value > 0 ? 'text-primary-700' : 'text-gray-400'
          )}>
            {value}
          </span>
          
          <button
            onClick={() => onAllocate(1)}
            disabled={!canIncrease}
            className={cn(
              'w-7 h-7 rounded flex items-center justify-center font-bold',
              canIncrease
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            )}
          >
            +
          </button>
        </div>
      </div>
      
      {showDescription && skill.description && (
        <p className="text-xs text-gray-600 mt-2 border-t border-gray-200 pt-2">
          {skill.description}
        </p>
      )}
    </div>
  );
}
