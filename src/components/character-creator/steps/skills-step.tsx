/**
 * Skills Step
 * ============
 * Allocate skill points with real data from Firebase RTDB
 * Skills are grouped by the 6 abilities, with a 7th section for sub-skills
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
  // Track expanded state for each category independently
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Strength']));

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

  // Group skills by ability - some skills appear in multiple ability categories
  // Also create a separate sub-skills group
  const { groupedSkills, subSkills } = useMemo(() => {
    if (!skills) return { groupedSkills: {}, subSkills: [] };
    
    const groups: Record<string, RTDBSkill[]> = {};
    const subs: RTDBSkill[] = [];
    
    // Initialize ability groups
    ABILITY_ORDER.forEach(ability => {
      groups[ability] = [];
    });
    
    skills.forEach(skill => {
      // Sub-skills require a base skill
      if (skill.base_skill) {
        subs.push(skill);
        return;
      }
      
      // Get abilities this skill can use (may be comma-separated or array)
      let skillAbilities: string[] = [];
      if (typeof skill.ability === 'string') {
        skillAbilities = skill.ability.split(',').map(a => a.trim());
      } else if (Array.isArray(skill.ability)) {
        skillAbilities = (skill.ability as any[]).map(a => String(a).trim());
      }
      
      // Add skill to each ability group it belongs to
      skillAbilities.forEach(ability => {
        const abilityKey = ability.charAt(0).toUpperCase() + ability.slice(1).toLowerCase();
        if (ABILITY_ORDER.includes(abilityKey)) {
          // Avoid duplicates in the same group
          if (!groups[abilityKey].some(s => s.id === skill.id)) {
            groups[abilityKey].push(skill);
          }
        }
      });
      
      // If no abilities matched, put in first ability or General
      if (skillAbilities.length === 0) {
        groups[ABILITY_ORDER[0]].push(skill);
      }
    });
    
    return { groupedSkills: groups, subSkills: subs };
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

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

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
            Skills are organized by their associated ability.
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
      
      {/* Skills by Ability */}
      <div className="space-y-4 mb-8">
        {ABILITY_ORDER.map((ability) => {
          const categorySkills = groupedSkills[ability] || [];
          if (categorySkills.length === 0) return null;
          
          const categoryPoints = categorySkills.reduce(
            (sum, s) => sum + (allocations[s.id] || 0), 0
          );
          const isExpanded = expandedCategories.has(ability);
          
          return (
            <div key={ability} className="bg-white rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => toggleCategory(ability)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-gray-900">{ability}</h3>
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
                      key={`${ability}-${skill.id}`}
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
        
        {/* Sub-Skills Section */}
        {subSkills.length > 0 && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <button
              onClick={() => toggleCategory('sub-skills')}
              className="w-full px-4 py-3 flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-gray-700">Sub-Skills</h3>
                <span className="text-sm text-gray-500">
                  {subSkills.length} skills (require base skill)
                </span>
              </div>
              <span className={cn(
                'transition-transform',
                expandedCategories.has('sub-skills') && 'rotate-180'
              )}>
                ▼
              </span>
            </button>
            
            {expandedCategories.has('sub-skills') && (
              <div className="p-4 grid md:grid-cols-2 gap-3">
                {subSkills.map(skill => {
                  const hasBaseSkill = allocations[skill.base_skill || ''] > 0;
                  return (
                    <div
                      key={skill.id}
                      className={cn(
                        'p-3 rounded-lg border',
                        hasBaseSkill ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-200 opacity-60'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">{skill.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            (Requires: {skill.base_skill})
                          </span>
                        </div>
                        {hasBaseSkill ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAllocate(skill.id, -1)}
                              disabled={(allocations[skill.id] || 0) === 0}
                              className="btn-stepper btn-stepper-danger !w-7 !h-7 text-sm"
                            >
                              −
                            </button>
                            <span className={cn(
                              'w-8 text-center font-bold',
                              (allocations[skill.id] || 0) > 0 ? 'text-primary-700' : 'text-gray-400'
                            )}>
                              {allocations[skill.id] || 0}
                            </span>
                            <button
                              onClick={() => handleAllocate(skill.id, 1)}
                              disabled={remainingPoints <= 0}
                              className="btn-stepper btn-stepper-success !w-7 !h-7 text-sm"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Locked</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
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
          className="btn-back"
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          className="btn-continue"
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
            className="btn-stepper btn-stepper-danger !w-7 !h-7 text-sm"
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
            className="btn-stepper btn-stepper-success !w-7 !h-7 text-sm"
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
