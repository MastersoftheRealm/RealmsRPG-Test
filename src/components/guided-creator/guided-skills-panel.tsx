/**
 * GuidedSkillsPanel — Layer 1 skill allocation for the guided creator.
 * Simplified rows: name + ability + source chip, bonus ± with formula tip, X remove, expand description.
 * Layer 2 browse lives in the parent step (below recommended skills), not on this list.
 */

'use client';

import { useMemo, useCallback, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { cn, formatBonus } from '@/lib/utils';
import { useCodexSkills, useGameRules, type Skill } from '@/hooks';
import {
  calculateSkillBonusWithProficiency,
  calculateSubSkillBonusWithProficiency,
  getHighestLinkedAbilityKey,
  getLinkedAbilityKeys,
} from '@/lib/game/formulas';
import {
  getSkillValueIncreaseCost,
  resolveSkillAllocationRules,
} from '@/lib/game/skill-allocation';
import { formatGuidedSkillAbilityTag } from '@/lib/guided-creator/curated-skills';
import { DecrementButton, IncrementButton, InfoTippy, PointStatus } from '@/components/shared';
import { DescriptorChip, IconButton, Spinner } from '@/components/ui';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { getGuidedSkillBonusHelp } from '../../../public/tooltip-text';
import type { Abilities } from '@/types';

const panelCopy = GUIDED_CREATOR_COPY.steps.skills;

export interface GuidedSkillsPanelProps {
  abilities: Abilities;
  allocations: Record<string, number>;
  speciesSkillIds: Set<string>;
  pathSkillIds: Set<string>;
  pathSourceLabel?: string;
  totalPoints: number;
  spentPoints: number;
  onAllocationsChange: (allocations: Record<string, number>) => void;
  className?: string;
}

interface GuidedSkillRowItem {
  skill: Skill;
  value: number;
  bonus: number;
  abilityLabel: string | null;
  abilityValue: number;
  multiAbility: boolean;
  isSpecies: boolean;
  isPath: boolean;
  isSubSkill: boolean;
  baseSkillName?: string;
  canIncrease: boolean;
  canDecrease: boolean;
}

function GuidedSkillRow({
  item,
  pathSourceLabel,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  item: GuidedSkillRowItem;
  pathSourceLabel?: string;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const {
    skill,
    value,
    bonus,
    abilityLabel,
    abilityValue,
    multiAbility,
    isSpecies,
    isPath,
    isSubSkill,
    baseSkillName,
    canIncrease,
    canDecrease,
  } = item;
  const bonusTone =
    bonus > 0 ? 'text-success-fg' : bonus < 0 ? 'text-danger-fg' : 'text-text-secondary';

  const hasDescription = Boolean(skill.description);
  const skillName = skill.name ?? 'skill';
  const bonusHelp = abilityLabel
    ? getGuidedSkillBonusHelp({
        abilityLabel,
        abilityValue,
        skillValue: value,
        skillBonus: bonus,
        multiAbility,
      })
    : null;

  return (
    <li className="border-b border-border-light last:border-b-0">
      {/* DESIGN_INTENT: Name, chevron, and desc chips share one horizontal band (chips to the
          right of the name); wrap only when width forces it. Controls stay shrink-0. */}
      <div className="flex items-start gap-2 py-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <button
              type="button"
              onClick={() => hasDescription && setExpanded(!expanded)}
              disabled={!hasDescription}
              className={cn(
                'inline-flex min-h-11 max-w-full shrink-0 items-center gap-1.5 py-0 text-left',
                hasDescription ? 'cursor-pointer' : 'cursor-default',
              )}
              aria-expanded={hasDescription ? expanded : undefined}
              aria-label={
                hasDescription
                  ? `${expanded ? 'Collapse' : 'Expand'} ${skillName} description`
                  : undefined
              }
            >
              <span className="font-nunito font-semibold text-text-primary">
                {item.isSubSkill ? <span className="pl-1 text-text-secondary">↳ </span> : null}
                {skill.name}
              </span>
              {hasDescription && (
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-text-muted transition-transform',
                    expanded && 'rotate-180',
                  )}
                  aria-hidden
                />
              )}
            </button>
            {/* DESIGN_INTENT: Ability = primary (guided ability chips); Species = descriptor; path = primary source */}
            {abilityLabel && (
              <DescriptorChip
                variant="primary"
                size="sm"
                title={`Contributing Ability: ${abilityLabel}`}
              >
                {abilityLabel}
              </DescriptorChip>
            )}
            {isSubSkill && baseSkillName && (
              <DescriptorChip variant="descriptor" size="sm" title={baseSkillName}>
                {baseSkillName}
              </DescriptorChip>
            )}
            {isSpecies && (
              <DescriptorChip variant="descriptor" size="sm">
                Species
              </DescriptorChip>
            )}
            {isPath && pathSourceLabel && (
              <DescriptorChip variant="primary" size="sm" title={pathSourceLabel}>
                {pathSourceLabel}
              </DescriptorChip>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <DecrementButton
            onClick={onDecrease}
            disabled={!canDecrease}
            size="sm"
            title={`Decrease ${skillName} Skill Value`}
          />
          {/* DESIGN_INTENT: Skill Bonus tip uses InfoTippy + getGuidedSkillBonusHelp (parameterized
              like getAbilityPointsHelp) — supplementary formula copy with live numbers, not a required control. */}
          {bonusHelp ? (
            <InfoTippy
              content={bonusHelp}
              label={`How ${skillName} Skill Bonus is calculated`}
              placement="top"
            >
              <button
                type="button"
                aria-label={`${formatBonus(bonus)}, how ${skillName} Skill Bonus is calculated`}
                className={cn(
                  'min-h-11 min-w-[2.5rem] rounded-md px-0.5 text-center font-display text-base font-bold tabular-nums sm:min-w-[2.75rem] sm:text-lg',
                  'hover:bg-surface-alt focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2 focus-visible:outline-none',
                  bonusTone,
                )}
              >
                {formatBonus(bonus)}
              </button>
            </InfoTippy>
          ) : (
            <span
              className={cn(
                'min-w-[2.5rem] text-center font-display text-base font-bold tabular-nums sm:min-w-[2.75rem] sm:text-lg',
                bonusTone,
              )}
            >
              {formatBonus(bonus)}
            </span>
          )}
          <IncrementButton
            onClick={onIncrease}
            disabled={!canIncrease}
            size="sm"
            title={`Increase ${skillName} Skill Value`}
          />
          {onRemove ? (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onRemove}
              label={`Remove ${skillName}`}
              className="min-h-11 min-w-11 shrink-0 text-danger-fg hover:bg-danger-light"
            >
              <X className="h-4 w-4" aria-hidden />
            </IconButton>
          ) : (
            <span className="w-11 shrink-0" aria-hidden />
          )}
        </div>
      </div>

      {expanded && skill.description && (
        <div className="pr-2 pb-2.5">
          <p className="font-nunito text-sm leading-relaxed text-text-secondary">
            {skill.description}
          </p>
        </div>
      )}
    </li>
  );
}

export function GuidedSkillsPanel({
  abilities,
  allocations,
  speciesSkillIds,
  pathSkillIds,
  pathSourceLabel,
  totalPoints,
  spentPoints,
  onAllocationsChange,
  className,
}: GuidedSkillsPanelProps) {
  const { data: allSkills = [], isLoading } = useCodexSkills();
  const { rules } = useGameRules();
  const skillRules = resolveSkillAllocationRules(rules);

  const remainingPoints = totalPoints - spentPoints;

  const visibleSkillIds = useMemo(() => {
    const ids = new Set<string>();
    speciesSkillIds.forEach((id) => {
      if (id !== '0') ids.add(id);
    });
    Object.keys(allocations).forEach((id) => ids.add(id));
    return ids;
  }, [speciesSkillIds, allocations]);

  const orderedSkills = useMemo(() => {
    const subsByBase: Record<string, Skill[]> = {};
    const inList = (id: string | number) => visibleSkillIds.has(String(id));

    allSkills.forEach((s) => {
      if (s.base_skill_id !== undefined) {
        const baseKey = String(s.base_skill_id);
        if (!subsByBase[baseKey]) subsByBase[baseKey] = [];
        subsByBase[baseKey].push(s);
      }
    });

    const baseSkills = allSkills.filter((s) => s.base_skill_id === undefined);
    const rank = (id: string) => {
      if (speciesSkillIds.has(id)) return 0;
      if (pathSkillIds.has(id)) return 1;
      return 2;
    };
    baseSkills.sort((a, b) => {
      const ra = rank(String(a.id));
      const rb = rank(String(b.id));
      if (ra !== rb) return ra - rb;
      return String(a.name ?? '').localeCompare(String(b.name ?? ''));
    });

    const result: Skill[] = [];
    baseSkills.forEach((base) => {
      const baseKey = String(base.id);
      const subs = subsByBase[baseKey] ?? [];
      const subsInList = subs.filter((sub) => inList(sub.id));
      const baseInList = inList(base.id);
      if (!baseInList && subsInList.length === 0) return;
      if (baseInList) result.push(base);
      subsInList.sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
      result.push(...subsInList);
    });
    return result;
  }, [allSkills, visibleSkillIds, speciesSkillIds, pathSkillIds]);

  const handleRemove = useCallback(
    (skillId: string) => {
      if (speciesSkillIds.has(skillId)) return;
      const rest = { ...allocations };
      delete rest[skillId];
      onAllocationsChange(rest);
    },
    [allocations, speciesSkillIds, onAllocationsChange],
  );

  const handleAllocate = useCallback(
    (skillId: string, delta: number) => {
      const skill = allSkills.find((s) => String(s.id) === skillId);
      if (!skill) return;

      const current = allocations[skillId] ?? 0;
      const isSubSkill = skill.base_skill_id !== undefined;

      if (delta > 0) {
        const cost = getSkillValueIncreaseCost(current, isSubSkill, skillRules);
        if (remainingPoints < cost) return;
        onAllocationsChange({ ...allocations, [skillId]: current + 1 });
      } else if (current > 0) {
        const newVal = current - 1;
        if (isSubSkill && newVal === 0) {
          handleRemove(skillId);
        } else {
          onAllocationsChange({ ...allocations, [skillId]: newVal });
        }
      }
    },
    [allocations, allSkills, remainingPoints, onAllocationsChange, skillRules, handleRemove],
  );

  const rowItems = useMemo((): GuidedSkillRowItem[] => {
    return orderedSkills.map((skill) => {
      const skillId = String(skill.id);
      const isSubSkill = skill.base_skill_id !== undefined;
      const baseSkill = isSubSkill
        ? allSkills.find((s) => String(s.id) === String(skill.base_skill_id))
        : null;
      const baseValue = baseSkill ? (allocations[String(baseSkill.id)] ?? 0) : 0;
      const baseProficient = Boolean(
        baseSkill &&
        (speciesSkillIds.has(String(baseSkill.id)) ||
          (allocations[String(baseSkill.id)] ?? -1) >= 0),
      );
      const value = Math.max(0, allocations[skillId] ?? 0);
      const isSpecies = speciesSkillIds.has(skillId);
      const isPath = !isSpecies && pathSkillIds.has(skillId);
      const skillForAbility = baseSkill ?? skill;
      const linkedKeys = getLinkedAbilityKeys(skillForAbility.ability);
      const chosenAbilityKey =
        getHighestLinkedAbilityKey(skillForAbility.ability, abilities) ?? linkedKeys[0];
      const abilityValue = chosenAbilityKey ? (abilities[chosenAbilityKey] ?? 0) : 0;
      const abilityLabel = formatGuidedSkillAbilityTag(skillForAbility, abilities);
      const proficient = isSubSkill ? value >= 1 : value >= 0;
      const bonus = isSubSkill
        ? calculateSubSkillBonusWithProficiency(
            skill.ability,
            value,
            baseValue,
            baseProficient,
            abilities,
            proficient,
            chosenAbilityKey,
          )
        : calculateSkillBonusWithProficiency(
            skill.ability,
            value,
            abilities,
            true,
            chosenAbilityKey,
          );
      const canInc = isSubSkill
        ? baseProficient &&
          remainingPoints >=
            (value === 0
              ? skillRules.gainProficiencyCost
              : getSkillValueIncreaseCost(value, true, skillRules))
        : remainingPoints >=
          (value === 0
            ? skillRules.gainProficiencyCost
            : getSkillValueIncreaseCost(value, false, skillRules));

      return {
        skill,
        value,
        bonus,
        abilityLabel,
        abilityValue,
        multiAbility: linkedKeys.length > 1,
        isSpecies,
        isPath,
        isSubSkill,
        baseSkillName: isSubSkill ? baseSkill?.name : undefined,
        canIncrease: canInc,
        canDecrease: value > 0,
      };
    });
  }, [
    orderedSkills,
    allSkills,
    allocations,
    speciesSkillIds,
    pathSkillIds,
    abilities,
    remainingPoints,
    skillRules,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-center">
        <PointStatus
          total={totalPoints}
          spent={spentPoints}
          label="Skill Points"
          variant="inline"
        />
      </div>

      <div className="rounded-card border border-border-light bg-surface shadow-sm">
        {rowItems.length === 0 ? (
          <p className="px-4 py-8 text-center font-nunito text-sm text-text-secondary">
            {panelCopy.emptySkills}
          </p>
        ) : (
          <ul className="px-3 sm:px-4">
            {rowItems.map((item) => {
              const skillId = String(item.skill.id);
              return (
                <GuidedSkillRow
                  key={skillId}
                  item={item}
                  pathSourceLabel={pathSourceLabel}
                  onDecrease={() => handleAllocate(skillId, -1)}
                  onIncrease={() => handleAllocate(skillId, 1)}
                  onRemove={item.isSpecies ? undefined : () => handleRemove(skillId)}
                />
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
