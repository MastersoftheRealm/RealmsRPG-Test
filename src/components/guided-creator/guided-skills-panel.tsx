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
  getHighestLinkedAbilityKey,
  getLinkedAbilityKeys,
} from '@/lib/game/formulas';
import {
  getSkillValueIncreaseCost,
  resolveSkillAllocationRules,
} from '@/lib/game/skill-allocation';
import { formatGuidedSkillAbilityTag } from '@/lib/guided-creator/curated-skills';
import {
  DecrementButton,
  IncrementButton,
  InfoTippy,
  PointStatus,
} from '@/components/shared';
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
    canIncrease,
    canDecrease,
  } = item;
  const bonusTone =
    bonus > 0
      ? 'text-success-fg'
      : bonus < 0
        ? 'text-danger-fg'
        : 'text-text-secondary';

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
      {/* DESIGN_INTENT: Name+chevron on one line; chips wrap below so they never collide with
          expand control or ± steppers. Controls stay a shrink-0 column (not fighting chip width). */}
      <div className="flex items-start gap-2 py-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => hasDescription && setExpanded(!expanded)}
            disabled={!hasDescription}
            className={cn(
              'flex max-w-full items-center gap-1.5 text-left min-h-11 py-0',
              hasDescription ? 'cursor-pointer' : 'cursor-default'
            )}
            aria-expanded={hasDescription ? expanded : undefined}
            aria-label={
              hasDescription
                ? `${expanded ? 'Collapse' : 'Expand'} ${skillName} description`
                : undefined
            }
          >
            <span className="font-nunito font-semibold text-text-primary">{skill.name}</span>
            {hasDescription && (
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-text-muted dark:text-text-secondary transition-transform',
                  expanded && 'rotate-180'
                )}
                aria-hidden
              />
            )}
          </button>
          {(abilityLabel || isSpecies || (isPath && pathSourceLabel)) && (
            <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
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
          )}
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
                  'min-w-[2.5rem] min-h-11 px-0.5 text-center font-display text-base font-bold tabular-nums rounded-md sm:min-w-[2.75rem] sm:text-lg',
                  'hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2',
                  bonusTone
                )}
              >
                {formatBonus(bonus)}
              </button>
            </InfoTippy>
          ) : (
            <span
              className={cn(
                'min-w-[2.5rem] text-center font-display text-base font-bold tabular-nums sm:min-w-[2.75rem] sm:text-lg',
                bonusTone
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
              className="shrink-0 text-danger-fg hover:bg-danger-light min-h-11 min-w-11"
            >
              <X className="h-4 w-4" aria-hidden />
            </IconButton>
          ) : (
            <span className="shrink-0 w-11" aria-hidden />
          )}
        </div>
      </div>

      {expanded && skill.description && (
        <div className="pb-2.5 pr-2">
          <p className="font-nunito text-sm text-text-secondary leading-relaxed">
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
    const base = allSkills.filter(
      (s) => s.base_skill_id === undefined && visibleSkillIds.has(String(s.id))
    );
    const rank = (id: string) => {
      if (speciesSkillIds.has(id)) return 0;
      if (pathSkillIds.has(id)) return 1;
      return 2;
    };
    return base.sort((a, b) => {
      const ra = rank(String(a.id));
      const rb = rank(String(b.id));
      if (ra !== rb) return ra - rb;
      return String(a.name ?? '').localeCompare(String(b.name ?? ''));
    });
  }, [allSkills, visibleSkillIds, speciesSkillIds, pathSkillIds]);

  const handleRemove = useCallback(
    (skillId: string) => {
      if (speciesSkillIds.has(skillId)) return;
      const rest = { ...allocations };
      delete rest[skillId];
      onAllocationsChange(rest);
    },
    [allocations, speciesSkillIds, onAllocationsChange]
  );

  const handleAllocate = useCallback(
    (skillId: string, delta: number) => {
      const skill = allSkills.find((s) => String(s.id) === skillId);
      if (!skill) return;

      const current = allocations[skillId] ?? 0;

      if (delta > 0) {
        const cost = getSkillValueIncreaseCost(current, false, skillRules);
        if (remainingPoints < cost) return;
        onAllocationsChange({ ...allocations, [skillId]: current + 1 });
      } else if (current > 0) {
        onAllocationsChange({ ...allocations, [skillId]: current - 1 });
      }
    },
    [allocations, allSkills, remainingPoints, onAllocationsChange, skillRules]
  );

  const rowItems = useMemo((): GuidedSkillRowItem[] => {
    return orderedSkills.map((skill) => {
      const skillId = String(skill.id);
      const value = Math.max(0, allocations[skillId] ?? 0);
      const isSpecies = speciesSkillIds.has(skillId);
      const isPath = !isSpecies && pathSkillIds.has(skillId);
      const linkedKeys = getLinkedAbilityKeys(skill.ability);
      const chosenAbilityKey =
        getHighestLinkedAbilityKey(skill.ability, abilities) ?? linkedKeys[0];
      const abilityValue = chosenAbilityKey ? (abilities[chosenAbilityKey] ?? 0) : 0;
      const abilityLabel = formatGuidedSkillAbilityTag(skill, abilities);
      const bonus = calculateSkillBonusWithProficiency(
        skill.ability,
        value,
        abilities,
        true,
        chosenAbilityKey
      );
      const canInc =
        remainingPoints >=
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
        canIncrease: canInc,
        canDecrease: value > 0,
      };
    });
  }, [
    orderedSkills,
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
          className="text-base"
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
                  onRemove={
                    item.isSpecies
                      ? undefined
                      : () => handleRemove(skillId)
                  }
                />
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
