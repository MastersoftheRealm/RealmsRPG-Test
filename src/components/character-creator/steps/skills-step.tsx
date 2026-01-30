/**
 * Skills Step
 * ============
 * Allocate skill points with real data from Firebase RTDB
 * Skills are grouped by the 6 abilities, with sub-skills nested under their base skills
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { useRTDBSkills, type RTDBSkill } from '@/hooks';
import { calculateSkillPoints } from '@/lib/game/formulas';
import { ValueStepper } from '@/components/shared';
import { Button, Alert } from '@/components/ui';

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
  // Sub-skills are grouped with their base skills in each ability section
  const { groupedSkills, subSkillsByBase } = useMemo(() => {
    if (!skills) return { groupedSkills: {}, subSkillsByBase: {} };
    
    const groups: Record<string, RTDBSkill[]> = {};
    const subsByBase: Record<string, RTDBSkill[]> = {};
    
    // Initialize ability groups
    ABILITY_ORDER.forEach(ability => {
      groups[ability] = [];
    });
    
    // First pass: identify all sub-skills and group by base skill
    skills.forEach(skill => {
      if (skill.base_skill) {
        if (!subsByBase[skill.base_skill]) {
          subsByBase[skill.base_skill] = [];
        }
        subsByBase[skill.base_skill].push(skill);
      }
    });
    
    // Second pass: group main skills by ability
    skills.forEach(skill => {
      // Skip sub-skills - they'll be nested under their base skill
      if (skill.base_skill) {
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
    
    return { groupedSkills: groups, subSkillsByBase: subsByBase };
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
          <h1 className="text-2xl font-bold text-text-primary mb-2">Allocate Skills</h1>
          <p className="text-text-secondary">
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
          
          // Count points for base skills and their sub-skills
          let categoryPoints = 0;
          categorySkills.forEach(skill => {
            categoryPoints += allocations[skill.id] || 0;
            // Add sub-skill points
            const subs = subSkillsByBase[skill.id] || [];
            subs.forEach(sub => {
              categoryPoints += allocations[sub.id] || 0;
            });
          });
          
          // Count sub-skills in this category
          const subSkillCount = categorySkills.reduce((count, skill) => {
            return count + (subSkillsByBase[skill.id]?.length || 0);
          }, 0);
          
          const isExpanded = expandedCategories.has(ability);
          
          return (
            <div key={ability} className="bg-surface rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => toggleCategory(ability)}
                className="w-full px-4 py-3 flex items-center justify-between bg-surface-alt hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-text-primary">{ability}</h3>
                  <span className="text-sm text-text-muted">
                    {categorySkills.length} skills{subSkillCount > 0 && `, ${subSkillCount} sub-skills`}
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
                <div className="p-4 space-y-3">
                  {categorySkills.map(skill => {
                    const skillSubSkills = subSkillsByBase[skill.id] || [];
                    const hasSubSkills = skillSubSkills.length > 0;
                    const baseSkillValue = allocations[skill.id] || 0;
                    
                    return (
                      <div key={`${ability}-${skill.id}`}>
                        {/* Base Skill */}
                        <SkillAllocator
                          skill={skill}
                          value={baseSkillValue}
                          onAllocate={(delta) => handleAllocate(skill.id, delta)}
                          canIncrease={remainingPoints > 0}
                        />
                        
                        {/* Sub-Skills (nested under base skill) */}
                        {hasSubSkills && (
                          <div className="ml-6 mt-2 pl-3 border-l-2 border-border-light space-y-2">
                            {skillSubSkills.map(subSkill => {
                              const isUnlocked = baseSkillValue > 0;
                              return (
                                <SubSkillAllocator
                                  key={subSkill.id}
                                  skill={subSkill}
                                  value={allocations[subSkill.id] || 0}
                                  onAllocate={(delta) => handleAllocate(subSkill.id, delta)}
                                  canIncrease={remainingPoints > 0}
                                  isUnlocked={isUnlocked}
                                  baseSkillName={skill.name}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {(!skills || skills.length === 0) && (
        <Alert variant="warning" className="mb-8">
          No skill data available. Please check Firebase connection.
        </Alert>
      )}
      
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={prevStep}
        >
          ← Back
        </Button>
        <Button
          onClick={handleContinue}
        >
          Continue →
        </Button>
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
      value > 0 ? 'bg-primary-50 border-primary-200' : 'bg-surface-alt border-border-light'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDescription(!showDescription)}
            className="text-text-muted hover:text-text-secondary text-sm"
          >
            ℹ️
          </button>
          <span className="font-medium text-text-primary">{skill.name}</span>
        </div>
        
        <ValueStepper
          value={value}
          onChange={(newValue) => onAllocate(newValue - value)}
          min={0}
          max={canIncrease ? undefined : value}
          size="sm"
          enableHoldRepeat
        />
      </div>
      
      {showDescription && skill.description && (
        <p className="text-xs text-text-secondary mt-2 border-t border-border-light pt-2">
          {skill.description}
        </p>
      )}
    </div>
  );
}

interface SubSkillAllocatorProps {
  skill: RTDBSkill;
  value: number;
  onAllocate: (delta: number) => void;
  canIncrease: boolean;
  isUnlocked: boolean;
  baseSkillName: string;
}

function SubSkillAllocator({ skill, value, onAllocate, canIncrease, isUnlocked, baseSkillName }: SubSkillAllocatorProps) {
  return (
    <div className={cn(
      'p-2 rounded-lg border transition-colors text-sm',
      !isUnlocked && 'opacity-50 bg-neutral-100 border-border-light',
      isUnlocked && value > 0 && 'bg-primary-50 border-primary-200',
      isUnlocked && value === 0 && 'bg-surface-alt border-border-light'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">↳</span>
          <span className={cn(
            'font-medium',
            isUnlocked ? 'text-text-primary' : 'text-text-muted'
          )}>
            {skill.name}
          </span>
        </div>
        
        {isUnlocked ? (
          <ValueStepper
            value={value}
            onChange={(newValue) => onAllocate(newValue - value)}
            min={0}
            max={canIncrease ? undefined : value}
            size="xs"
            enableHoldRepeat
          />
        ) : (
          <span className="text-xs text-text-muted italic">
            Requires {baseSkillName}
          </span>
        )}
      </div>
    </div>
  );
}
