/**
 * GuidedSkillsPanel — Layer 1 skill allocation for the guided creator.
 * Simplified rows: name + source chip, bonus ±, X remove on right, tap to expand description.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
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
import type { AddSkillModalSkillBadge } from '@/components/shared/add-skill-modal';
import { AddSkillModal, PointStatus } from '@/components/shared';
import { Button, DescriptorChip, IconButton, Spinner } from '@/components/ui';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
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
  /** Descriptor chips for recommended skills in browse-all modal (Layer 2). */
  browseSkillBadgesById?: Record<string, AddSkillModalSkillBadge[]>;
  /** Skill ids to pin at top of browse-all modal. */
  browseRecommendedSkillIds?: string[];
  className?: string;
}

interface GuidedSkillRowItem {
  skill: Skill;
  value: number;
  bonus: number;
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
  const { skill, bonus, isSpecies, isPath, canIncrease, canDecrease } = item;
  const bonusTone =
    bonus > 0
      ? 'text-success-700 dark:text-success-400'
      : bonus < 0
        ? 'text-danger-700 dark:text-danger-400'
        : 'text-text-secondary';

  const hasDescription = Boolean(skill.description);

  return (
    <li className="border-b border-border-light last:border-b-0">
      <div className="flex items-center gap-2 sm:gap-3 py-2.5">
        <button
          type="button"
          onClick={() => hasDescription && setExpanded(!expanded)}
          disabled={!hasDescription}
          className={cn(
            'min-w-0 flex-1 flex items-center gap-2 text-left min-h-11',
            hasDescription && 'cursor-pointer'
          )}
          aria-expanded={hasDescription ? expanded : undefined}
          aria-label={hasDescription ? `${expanded ? 'Collapse' : 'Expand'} ${skill.name} description` : undefined}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-nunito font-semibold text-text-primary">{skill.name}</span>
              {isSpecies && (
                <DescriptorChip variant="descriptor" size="sm">Species</DescriptorChip>
              )}
              {isPath && pathSourceLabel && (
                <DescriptorChip variant="primary" size="sm">{pathSourceLabel}</DescriptorChip>
              )}
            </div>
          </div>
          {hasDescription && (
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-text-muted transition-transform',
                expanded && 'rotate-180'
              )}
              aria-hidden
            />
          )}
        </button>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={onDecrease}
            disabled={!canDecrease}
            aria-label={`Decrease ${skill.name ?? 'skill'} bonus`}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold transition-colors',
              canDecrease
                ? 'bg-surface-alt text-text-secondary hover:bg-surface'
                : 'cursor-not-allowed text-border-light'
            )}
          >
            −
          </button>
          <span
            className={cn(
              'min-w-[2.75rem] text-center font-display text-lg font-bold tabular-nums',
              bonusTone
            )}
          >
            {formatBonus(bonus)}
          </span>
          <button
            type="button"
            onClick={onIncrease}
            disabled={!canIncrease}
            aria-label={`Increase ${skill.name ?? 'skill'} bonus`}
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-lg text-lg font-bold transition-colors',
              canIncrease
                ? 'bg-surface-alt text-text-secondary hover:bg-surface'
                : 'cursor-not-allowed text-border-light'
            )}
          >
            +
          </button>
        </div>

        {onRemove ? (
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onRemove}
            label={`Remove ${skill.name ?? 'skill'}`}
            className="shrink-0 text-danger-700 hover:bg-danger-light dark:text-danger-400 min-h-11 min-w-11"
          >
            <X className="h-4 w-4" aria-hidden />
          </IconButton>
        ) : (
          <span className="shrink-0 w-11" aria-hidden />
        )}
      </div>

      {expanded && skill.description && (
        <div className="pb-3 pl-2 pr-12">
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
  browseSkillBadgesById,
  browseRecommendedSkillIds,
  className,
}: GuidedSkillsPanelProps) {
  const { data: allSkills = [], isLoading } = useCodexSkills();
  const { rules } = useGameRules();
  const skillRules = resolveSkillAllocationRules(rules);
  const [addSkillModalOpen, setAddSkillModalOpen] = useState(false);

  const remainingPoints = totalPoints - spentPoints;
  const maxAddSkillSelections = Math.floor(
    remainingPoints / skillRules.gainProficiencyCost
  );

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

  const existingSkillNames = useMemo(
    () =>
      allSkills
        .filter((s) => visibleSkillIds.has(String(s.id)))
        .map((s) => s.name)
        .filter((n): n is string => Boolean(n)),
    [allSkills, visibleSkillIds]
  );

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

  const handleAddSkills = useCallback(
    (skills: Skill[]) => {
      const next = { ...allocations };
      skills.forEach((s) => {
        const key = String(s.id);
        if (!(key in next)) next[key] = 0;
      });
      onAllocationsChange(next);
      setAddSkillModalOpen(false);
    },
    [allocations, onAllocationsChange]
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
          label="Skill points"
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

        <div className="border-t border-border-light px-4 py-3 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setAddSkillModalOpen(true)}
            className="min-h-11 font-nunito text-primary-link-fg hover:text-primary-fg-hover"
          >
            {panelCopy.browseAll}
          </Button>
        </div>
      </div>

      <AddSkillModal
        isOpen={addSkillModalOpen}
        onClose={() => setAddSkillModalOpen(false)}
        existingSkillNames={existingSkillNames}
        onAdd={handleAddSkills}
        skillBadgesById={browseSkillBadgesById}
        recommendedSkillIds={browseRecommendedSkillIds}
        maxSelections={maxAddSkillSelections}
        selectionLimitMessage={panelCopy.browseOverLimit(maxAddSkillSelections)}
      />
    </div>
  );
}
