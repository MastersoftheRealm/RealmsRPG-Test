/**
 * Skills Allocation Page
 * =======================
 * Shared component for skill point allocation in character creator and creature creator.
 * 
 * Features:
 * - Species skills (permanent, can't remove, tag "(species)", greyed remove)
 * - Add Skill / Add Sub-Skill modals
 * - Skill value allocation with proper point costs
 * - Defense allocation (2 pts per +1, max = level)
 * - Point counter
 * - Styling consistent with character sheet skills section
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { useCodexSkills, type Skill } from '@/hooks';
import {
  calculateSkillBonusWithProficiency,
  calculateSubSkillBonusWithProficiency,
  calculateSkillPointsForEntity,
} from '@/lib/game/formulas';
import {
  getTotalSkillPoints,
  getSkillValueIncreaseCost,
  calculateSimpleSkillPointsSpent,
  canIncreaseDefense,
} from '@/lib/game/skill-allocation';
import { SkillRow } from '@/components/shared';
import { Button, Spinner, Alert } from '@/components/ui';
import { PointStatus } from '@/components/shared';
import { AddSkillModal } from '@/components/character-sheet/add-skill-modal';
import { AddSubSkillModal } from '@/components/character-sheet/add-sub-skill-modal';
import type { Abilities, DefenseSkills } from '@/types';
import { DEFAULT_DEFENSE_SKILLS } from '@/types';

const ABILITY_ORDER = ['Strength', 'Vitality', 'Agility', 'Acuity', 'Intelligence', 'Charisma'];

const DEFENSE_KEYS: (keyof DefenseSkills)[] = [
  'might',
  'fortitude',
  'reflex',
  'discernment',
  'mentalFortitude',
  'resolve',
];

const DEFENSE_LABELS: Record<keyof DefenseSkills, string> = {
  might: 'Might',
  fortitude: 'Fortitude',
  reflex: 'Reflex',
  discernment: 'Discernment',
  mentalFortitude: 'Mental Fort.',
  resolve: 'Resolve',
};

export interface SkillsAllocationPageProps {
  /** Character or creature */
  entityType: 'character' | 'creature';
  level: number;
  abilities: Abilities;
  /** Current skill allocations: skillId -> value */
  allocations: Record<string, number>;
  /** Defense bonuses from skill points */
  defenseSkills: DefenseSkills;
  /** Species skill IDs (always proficient, can't remove) */
  speciesSkillIds: Set<string>;
  /** Callback when allocations change */
  onAllocationsChange: (allocations: Record<string, number>) => void;
  /** Callback when defense skills change */
  onDefenseChange: (defense: DefenseSkills) => void;
  /** Optional: ability-derived defense bonuses for cap check */
  abilityDefenseBonuses?: Partial<Record<keyof DefenseSkills, number>>;
  /** Optional footer (e.g. Back/Continue buttons) */
  footer?: React.ReactNode;
  /** Optional className */
  className?: string;
}

export function SkillsAllocationPage({
  entityType,
  level,
  abilities,
  allocations,
  defenseSkills,
  speciesSkillIds,
  onAllocationsChange,
  onDefenseChange,
  abilityDefenseBonuses = {},
  footer,
  className,
}: SkillsAllocationPageProps) {
  const { data: allSkills = [], isLoading } = useCodexSkills();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Strength']));
  const [addSkillModalOpen, setAddSkillModalOpen] = useState(false);
  const [addSubSkillModalOpen, setAddSubSkillModalOpen] = useState(false);

  const totalPoints = getTotalSkillPoints(level, entityType);

  const skillMeta = useMemo(() => {
    const map = new Map<string, { isSubSkill: boolean }>();
    allSkills.forEach((s: Skill) => {
      map.set(s.id, { isSubSkill: s.base_skill_id !== undefined });
    });
    return map;
  }, [allSkills]);

  const spentPoints = useMemo(
    () =>
      calculateSimpleSkillPointsSpent(
        allocations,
        speciesSkillIds,
        skillMeta,
        defenseSkills
      ),
    [allocations, speciesSkillIds, skillMeta, defenseSkills]
  );

  const remainingPoints = totalPoints - spentPoints;

  const { groupedSkills, subSkillsByBase } = useMemo(() => {
    if (!allSkills.length) return { groupedSkills: {} as Record<string, Skill[]>, subSkillsByBase: {} as Record<string, Skill[]> };
    const groups: Record<string, Skill[]> = {};
    const subsByBase: Record<string, Skill[]> = {};
    ABILITY_ORDER.forEach((a) => { groups[a] = []; });

    const skillById: Record<string, Skill> = {};
    allSkills.forEach((s: Skill) => { skillById[s.id] = s; });

    allSkills.forEach((s: Skill) => {
      if (s.base_skill_id !== undefined) {
        const baseKey = String(s.base_skill_id);
        if (!subsByBase[baseKey]) subsByBase[baseKey] = [];
        subsByBase[baseKey].push(s);
      }
    });

    allSkills.forEach((s: Skill) => {
      if (s.base_skill_id !== undefined) return;
      const abs = typeof s.ability === 'string'
        ? s.ability.split(',').map((a) => a.trim())
        : Array.isArray(s.ability)
          ? (s.ability as string[]).map((x) => String(x).trim())
          : [];
      abs.forEach((a) => {
        const key = a.charAt(0).toUpperCase() + a.slice(1).toLowerCase();
        if (ABILITY_ORDER.includes(key) && !groups[key].some((x) => x.id === s.id)) {
          groups[key].push(s);
        }
      });
      if (abs.length === 0) groups[ABILITY_ORDER[0]].push(s);
    });

    return { groupedSkills: groups, subSkillsByBase: subsByBase };
  }, [allSkills]);

  const existingSkillIds = useMemo(
    () => new Set([...speciesSkillIds, ...Object.keys(allocations)]),
    [speciesSkillIds, allocations]
  );

  const existingSkillNames = useMemo(() => {
    return allSkills
      .filter((s: Skill) => existingSkillIds.has(s.id))
      .map((s: Skill) => s.name);
  }, [allSkills, existingSkillIds]);

  const characterSkillsForSubModal = useMemo(() => {
    return allSkills
      .filter((s: Skill) => s.base_skill_id === undefined && existingSkillIds.has(s.id))
      .map((s: Skill) => ({ id: s.id, name: s.name, prof: (allocations[s.id] ?? 0) > 0 }));
  }, [allSkills, existingSkillIds, allocations]);

  const handleAllocate = useCallback(
    (skillId: string, delta: number) => {
      const skill = allSkills.find((s: Skill) => s.id === skillId);
      if (!skill) return;

      const current = allocations[skillId] ?? 0;
      const isSubSkill = skill.base_skill_id !== undefined;
      const isSpecies = speciesSkillIds.has(skillId);

      if (delta > 0) {
        const cost = current === 0 && !isSpecies
          ? 1 // proficiency
          : getSkillValueIncreaseCost(current, isSubSkill);
        if (remainingPoints < cost) return;

        if (current === 0 && !isSpecies) {
          onAllocationsChange({ ...allocations, [skillId]: 1 });
        } else {
          onAllocationsChange({ ...allocations, [skillId]: current + 1 });
        }
      } else {
        if (isSpecies && current <= 1) return;
        if (current <= 0) return;
        const newVal = current - 1;
        if (newVal === 0) {
          const { [skillId]: _, ...rest } = allocations;
          onAllocationsChange(rest);
        } else {
          onAllocationsChange({ ...allocations, [skillId]: newVal });
        }
      }
    },
    [allocations, allSkills, speciesSkillIds, remainingPoints, onAllocationsChange]
  );

  const handleRemoveSkill = useCallback(
    (skillId: string) => {
      if (speciesSkillIds.has(skillId)) return;
      const { [skillId]: _, ...rest } = allocations;
      onAllocationsChange(rest);
    },
    [allocations, speciesSkillIds, onAllocationsChange]
  );

  const handleAddSkills = useCallback(
    (skills: Skill[]) => {
      const next = { ...allocations };
      skills.forEach((s: Skill) => {
        if (!(s.id in next)) next[s.id] = 0;
      });
      onAllocationsChange(next);
      setAddSkillModalOpen(false);
    },
    [allocations, onAllocationsChange]
  );

  const handleAddSubSkills = useCallback(
    (skills: Array<Skill & { selectedBaseSkillId?: string; autoAddBaseSkill?: Skill }>) => {
      const next = { ...allocations };
      skills.forEach((s: Skill & { selectedBaseSkillId?: string; autoAddBaseSkill?: Skill }) => {
        if (s.autoAddBaseSkill && !(s.autoAddBaseSkill.id in next)) {
          next[s.autoAddBaseSkill.id] = 0;
        }
        if (!(s.id in next)) next[s.id] = 0;
      });
      onAllocationsChange(next);
      setAddSubSkillModalOpen(false);
    },
    [allocations, onAllocationsChange]
  );

  const handleDefenseChange = useCallback(
    (key: keyof DefenseSkills, delta: number) => {
      const current = defenseSkills[key] ?? 0;
      if (delta > 0) {
        const abilityBonus = abilityDefenseBonuses[key] ?? 0;
        const totalBonus = current + abilityBonus;
        if (totalBonus >= level) return;
        if (remainingPoints < 2) return;
        onDefenseChange({ ...defenseSkills, [key]: current + 1 });
      } else if (current > 0) {
        onDefenseChange({ ...defenseSkills, [key]: current - 1 });
      }
    },
    [defenseSkills, level, remainingPoints, abilityDefenseBonuses, onDefenseChange]
  );

  const getSkillBonus = useCallback(
    (skill: Skill, value: number, isProficient: boolean) => {
      return calculateSkillBonusWithProficiency(skill.ability, value, abilities, isProficient);
    },
    [abilities]
  );

  const getSubSkillBonus = useCallback(
    (skill: Skill, subValue: number, baseValue: number, baseProficient: boolean, isProficient: boolean) => {
      return calculateSubSkillBonusWithProficiency(
        skill.ability,
        subValue,
        baseValue,
        baseProficient,
        abilities,
        isProficient
      );
    },
    [abilities]
  );

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className={cn('max-w-5xl mx-auto', className)}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Allocate Skills</h1>
          <p className="text-text-secondary">
            Spend skill points to gain proficiency, increase skill values, or boost defenses.
            Species skills are always proficient and cannot be removed.
          </p>
        </div>
        <PointStatus total={totalPoints} spent={spentPoints} variant="compact" />
      </div>

      {/* Add Skill / Add Sub-Skill buttons */}
      <div className="flex gap-3 mb-6">
        <Button size="sm" onClick={() => setAddSkillModalOpen(true)}>
          <Plus size={14} />
          Add Skill
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="bg-teal-100 hover:bg-teal-200 text-teal-700"
          onClick={() => setAddSubSkillModalOpen(true)}
        >
          <Plus size={14} />
          Add Sub-Skill
        </Button>
      </div>

      {/* Species skills section */}
      {speciesSkillIds.size > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-2 uppercase tracking-wide">Species Skills</h2>
          <p className="text-sm text-text-muted mb-3">
            These skills are granted by your species. You can increase their values but cannot remove them.
          </p>
          <div className="space-y-2">
            {allSkills
              .filter((s: Skill) => speciesSkillIds.has(s.id))
              .map((skill: Skill) => {
                const value = Math.max(1, allocations[skill.id] ?? 1);
                const isProficient = true;
                const bonus = getSkillBonus(skill, value, isProficient);
                return (
                  <SkillRow
                    key={skill.id}
                    id={skill.id}
                    name={skill.name}
                    value={value}
                    bonus={bonus}
                    proficient={isProficient}
                    ability={skill.ability?.split(',')[0]?.trim()}
                    isEditing={true}
                    onValueChange={(d) => handleAllocate(skill.id, d)}
                    minValue={1}
                    canIncrease={remainingPoints >= getSkillValueIncreaseCost(value, false)}
                    isSpeciesSkill={true}
                    onRemove={() => {}}
                    variant="card"
                  />
                );
              })}
          </div>
        </div>
      )}

      {/* Skills by ability - only show species skills + skills user has added + bases with added sub-skills */}
      <div className="space-y-4 mb-8">
        {ABILITY_ORDER.map((ability) => {
          const allInCategory = groupedSkills[ability] || [];
          const categorySkills = allInCategory.filter((s) => {
            if (speciesSkillIds.has(s.id) || s.id in allocations) return true;
            const subs = subSkillsByBase[s.id] || [];
            return subs.some((sub) => speciesSkillIds.has(sub.id) || sub.id in allocations);
          });
          if (categorySkills.length === 0) return null;

          const isExpanded = expandedCategories.has(ability);
          return (
            <div key={ability} className="bg-surface rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => toggleCategory(ability)}
                className="w-full px-4 py-3 flex items-center justify-between bg-surface-alt hover:bg-surface transition-colors"
              >
                <h3 className="font-bold text-text-primary">{ability}</h3>
                <span className={cn('transition-transform', isExpanded && 'rotate-180')}>▼</span>
              </button>
              {isExpanded && (
                <div className="p-4 space-y-3">
                  {categorySkills.map((skill) => {
                    const skillSubSkills = [
                      ...(subSkillsByBase[skill.id] || []),
                      ...(subSkillsByBase['0'] || []),
                    ];
                    const baseValue = allocations[skill.id] ?? 0;
                    const isSpeciesSkill = speciesSkillIds.has(skill.id);
                    const effectiveBase = isSpeciesSkill ? Math.max(1, baseValue) : baseValue;
                    const baseProficient = effectiveBase > 0;
                    const skillAbility = skill.ability?.split(',')[0]?.trim() || 'strength';

                    return (
                      <div key={`${ability}-${skill.id}`}>
                        <SkillRow
                          id={skill.id}
                          name={skill.name}
                          value={effectiveBase}
                          bonus={getSkillBonus(skill, effectiveBase, baseProficient)}
                          proficient={baseProficient}
                          ability={skillAbility}
                          isEditing={true}
                          onValueChange={(d) => handleAllocate(skill.id, d)}
                          minValue={isSpeciesSkill ? 1 : 0}
                          canIncrease={
                            remainingPoints >= (effectiveBase === 0 ? 1 : getSkillValueIncreaseCost(effectiveBase, false))
                          }
                          isSpeciesSkill={isSpeciesSkill}
                          onRemove={isSpeciesSkill ? undefined : () => handleRemoveSkill(skill.id)}
                          variant="card"
                        />
                        {skillSubSkills.length > 0 && (
                          <div className="ml-6 mt-2 pl-3 border-l-2 border-border-light space-y-2">
                            {skillSubSkills
                              .filter((sub) => speciesSkillIds.has(sub.id) || sub.id in allocations)
                              .map((sub) => {
                              const subValue = allocations[sub.id] ?? 0;
                              const subIsSpecies = speciesSkillIds.has(sub.id);
                              const effectiveSub = subIsSpecies ? Math.max(1, subValue) : subValue;
                              const subProficient = effectiveSub > 0;
                              const isUnlocked = baseProficient || subIsSpecies;
                              return (
                                <SkillRow
                                  key={sub.id}
                                  id={sub.id}
                                  name={sub.name}
                                  isSubSkill={true}
                                  value={effectiveSub}
                                  bonus={getSubSkillBonus(sub, effectiveSub, effectiveBase, baseProficient, subProficient)}
                                  proficient={subProficient}
                                  isEditing={true}
                                  onValueChange={(d) => handleAllocate(sub.id, d)}
                                  minValue={subIsSpecies ? 1 : 0}
                                  canIncrease={
                                    isUnlocked &&
                                    remainingPoints >= (effectiveSub === 0 ? 1 : getSkillValueIncreaseCost(effectiveSub, true))
                                  }
                                  isUnlocked={isUnlocked}
                                  baseSkillName={skill.name}
                                  isSpeciesSkill={subIsSpecies}
                                  onRemove={subIsSpecies ? undefined : () => handleRemoveSkill(sub.id)}
                                  variant="compact"
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

      {/* Defense allocation */}
      <div className="bg-surface rounded-xl shadow-md p-4 mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-2 uppercase tracking-wide">Defense Bonuses</h2>
        <p className="text-sm text-text-muted mb-4">
          Spend 2 skill points to increase a defense bonus by 1. Defense bonus from skill points cannot exceed your level.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DEFENSE_KEYS.map((key) => {
            const current = defenseSkills[key] ?? 0;
            const abilityBonus = abilityDefenseBonuses[key] ?? 0;
            const canInc = canIncreaseDefense(current, level, abilityBonus, remainingPoints);
            return (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-alt border border-border-light"
              >
                <span className="font-medium text-text-primary">{DEFENSE_LABELS[key]}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDefenseChange(key, -1)}
                    disabled={current <= 0}
                    className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold bg-surface hover:bg-surface-alt disabled:opacity-50"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-mono text-sm">{current}</span>
                  <button
                    onClick={() => handleDefenseChange(key, 1)}
                    disabled={!canInc}
                    className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold bg-surface hover:bg-surface-alt disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {allSkills.length === 0 && (
        <Alert variant="warning" className="mb-8">
          No skill data available. Please check Firebase connection.
        </Alert>
      )}

      {footer && <div className="flex justify-between mt-6">{footer}</div>}

      <AddSkillModal
        isOpen={addSkillModalOpen}
        onClose={() => setAddSkillModalOpen(false)}
        existingSkillNames={existingSkillNames}
        onAdd={handleAddSkills}
      />

      <AddSubSkillModal
        isOpen={addSubSkillModalOpen}
        onClose={() => setAddSubSkillModalOpen(false)}
        characterSkills={characterSkillsForSubModal}
        existingSkillNames={existingSkillNames}
        onAdd={handleAddSubSkills}
      />
    </div>
  );
}
