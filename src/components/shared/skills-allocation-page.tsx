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
import { formatBonus } from '@/lib/utils';
import { SkillRow } from '@/components/shared';
import { Button, Spinner, Alert } from '@/components/ui';
import { PointStatus } from '@/components/shared';
import { AddSkillModal } from '@/components/character-sheet/add-skill-modal';
import { AddSubSkillModal } from '@/components/character-sheet/add-sub-skill-modal';
import type { Abilities, DefenseSkills } from '@/types';
import { DEFAULT_DEFENSE_SKILLS } from '@/types';

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
  /** Species skill IDs (always proficient, can't remove). Id "0" = "Any" (extra skill point only). */
  speciesSkillIds: Set<string>;
  /** Extra skill points (e.g. when species has skill id "0" = Any) */
  extraSkillPoints?: number;
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
  extraSkillPoints = 0,
  onAllocationsChange,
  onDefenseChange,
  abilityDefenseBonuses = {},
  footer,
  className,
}: SkillsAllocationPageProps) {
  const { data: allSkills = [], isLoading } = useCodexSkills();
  const [addSkillModalOpen, setAddSkillModalOpen] = useState(false);
  const [addSubSkillModalOpen, setAddSubSkillModalOpen] = useState(false);

  const totalPoints = getTotalSkillPoints(level, entityType) + extraSkillPoints;

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

  const { subSkillsByBase, orderedSkills } = useMemo(() => {
    const subsByBase: Record<string, Skill[]> = {};
    const inList = (id: string) =>
      (speciesSkillIds.has(id) && id !== '0') || id in allocations;
    if (!allSkills.length) return { subSkillsByBase: subsByBase, orderedSkills: [] as Skill[] };

    allSkills.forEach((s: Skill) => {
      if (s.base_skill_id !== undefined) {
        const baseKey = String(s.base_skill_id);
        if (!subsByBase[baseKey]) subsByBase[baseKey] = [];
        subsByBase[baseKey].push(s);
      }
    });

    const baseSkills = allSkills.filter((s: Skill) => s.base_skill_id === undefined);
    baseSkills.sort((a: Skill, b: Skill) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
    const result: Skill[] = [];
    baseSkills.forEach((base: Skill) => {
      const subs = subsByBase[base.id] || [];
      const subsInList = subs.filter((sub: Skill) => inList(sub.id));
      const baseInList = inList(base.id);
      if (!baseInList && subsInList.length === 0) return;
      if (baseInList) result.push(base);
      subsInList.sort((a: Skill, b: Skill) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
      result.push(...subsInList);
    });
    return { subSkillsByBase: subsByBase, orderedSkills: result };
  }, [allSkills, speciesSkillIds, allocations]);

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
        if (!(s.id in next)) next[s.id] = 1; // Auto proficient when adding
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
          next[s.autoAddBaseSkill.id] = 1; // Auto proficient
        }
        if (!(s.id in next)) next[s.id] = 1; // Auto proficient when adding sub-skill
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className={cn('max-w-5xl mx-auto', className)}>
      <div className="flex flex-nowrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Allocate Skills</h1>
          <p className="text-text-secondary">
            Spend skill points to gain proficiency, increase skill values, or boost defenses.
            Species skills are always proficient and cannot be removed.
            {speciesSkillIds.has('0') && ' Species option "Any" gives one extra skill point.'}
          </p>
        </div>
        <span className="flex-shrink-0 whitespace-nowrap">
          <PointStatus total={totalPoints} spent={spentPoints} variant="compact" />
        </span>
      </div>

      {/* Add Skill / Add Sub-Skill — disabled when no points */}
      <div className="flex gap-3 mb-6">
        <Button
          size="sm"
          onClick={() => setAddSkillModalOpen(true)}
          disabled={remainingPoints < 1}
          title={remainingPoints < 1 ? 'No skill points remaining' : undefined}
        >
          <Plus size={14} />
          Add Skill
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="bg-teal-100 hover:bg-teal-200 text-teal-700"
          onClick={() => setAddSubSkillModalOpen(true)}
          disabled={remainingPoints < 1}
          title={remainingPoints < 1 ? 'No skill points remaining' : undefined}
        >
          <Plus size={14} />
          Add Sub-Skill
        </Button>
      </div>

      {/* Single flat skills table — same layout as character sheet (Prof, Skill, Ability, Bonus, Value) */}
      <div className="bg-surface rounded-xl shadow-md overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-text-muted uppercase tracking-wider border-b-2 border-border-light">
                <th className="w-10 py-2 text-center">Prof</th>
                <th className="text-left py-2 pl-2">Skill</th>
                <th className="w-16 py-2 text-center">Ability</th>
                <th className="w-20 py-2 text-center">Bonus</th>
                <th className="w-24 py-2 text-center">Value</th>
                <th className="w-8 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {orderedSkills.map((skill) => {
                const isSubSkill = skill.base_skill_id !== undefined;
                const baseSkill = isSubSkill
                  ? allSkills.find((s: Skill) => String(s.id) === String(skill.base_skill_id))
                  : null;
                const baseValue = baseSkill ? (allocations[baseSkill.id] ?? 0) : 0;
                const baseProficient = baseValue > 0 || (baseSkill && speciesSkillIds.has(baseSkill.id));
                const value = Math.max(0, allocations[skill.id] ?? 0);
                const isSpeciesSkill = speciesSkillIds.has(skill.id);
                const effectiveValue = isSpeciesSkill ? Math.max(1, value) : value;
                const proficient = effectiveValue > 0;
                const bonus = isSubSkill
                  ? getSubSkillBonus(skill, effectiveValue, baseValue, baseProficient, proficient)
                  : getSkillBonus(skill, effectiveValue, proficient);
                const skillAbility = skill.ability?.split(',')[0]?.trim() || 'strength';
                const canInc = isSubSkill
                  ? baseProficient && remainingPoints >= (effectiveValue === 0 ? 1 : getSkillValueIncreaseCost(effectiveValue, true))
                  : remainingPoints >= (effectiveValue === 0 ? 1 : getSkillValueIncreaseCost(effectiveValue, false));
                return (
                  <SkillRow
                    key={skill.id}
                    id={skill.id}
                    name={skill.name ?? ''}
                    isSubSkill={isSubSkill}
                    baseSkillName={baseSkill?.name}
                    proficient={proficient}
                    canToggleProficiency={false}
                    value={effectiveValue}
                    bonus={bonus}
                    ability={skillAbility}
                    isEditing={true}
                    onValueChange={(d) => handleAllocate(skill.id, d)}
                    minValue={isSpeciesSkill ? 1 : 0}
                    canIncrease={canInc}
                    isSpeciesSkill={isSpeciesSkill}
                    onRemove={isSpeciesSkill ? undefined : () => handleRemoveSkill(skill.id)}
                    variant="table"
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        {orderedSkills.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            No skills added yet. Use &quot;Add Skill&quot; or &quot;Add Sub-Skill&quot; (need at least 1 skill point).
          </div>
        )}
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
            const totalBonus = abilityBonus + current;
            const canInc = canIncreaseDefense(current, level, abilityBonus, remainingPoints);
            return (
              <div
                key={key}
                className="flex flex-col p-3 rounded-lg bg-surface-alt border border-border-light"
              >
                <span className="font-medium text-text-primary mb-1">{DEFENSE_LABELS[key]}</span>
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDefenseChange(key, -1)}
                    disabled={current <= 0}
                    className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold bg-surface hover:bg-surface-alt disabled:opacity-50"
                  >
                    −
                  </button>
                  <span className="text-sm font-bold min-w-[36px] text-center text-primary-600 dark:text-primary-400">
                    {formatBonus(totalBonus)}
                  </span>
                  <button
                    onClick={() => handleDefenseChange(key, 1)}
                    disabled={!canInc}
                    className="w-6 h-6 rounded flex items-center justify-center text-sm font-bold bg-surface hover:bg-surface-alt disabled:opacity-50"
                    title={canInc ? 'Cost: 2 skill points' : `Max at level ${level}`}
                  >
                    +
                  </button>
                </div>
                {current > 0 && (
                  <span className="text-[9px] text-primary-600 dark:text-primary-400 font-medium mt-0.5">
                    +{current} ({current * 2}sp)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {allSkills.length === 0 && (
        <Alert variant="warning" className="mb-8">
          No skill data available. Please check Codex connection.
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
