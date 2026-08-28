/**
 * GuidedAbilitiesCustomizePanel — Layer 2 ability point-buy for the guided creator.
 * Matches GuidedSkillsPanel chrome: centered PointStatus + card-wrapped editor grid.
 * Layer navigation (back to recommendations) lives in the parent via GuidedLayerNav.
 */

'use client';

import { useMemo } from 'react';
import { AbilityScoreEditor } from '@/components/creator';
import { InfoTippy, PointStatus } from '@/components/patterns';
import type { AbilityName, Abilities } from '@/types';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { getAbilityPointsHelp } from '../../../public/tooltip-text';
import { useGameRules } from '@/hooks';

const panelCopy = GUIDED_CREATOR_COPY.steps.abilities;

export interface GuidedAbilitiesCustomizePanelProps {
  abilities: Abilities;
  totalPoints: number;
  spentPoints: number;
  onAbilityChange: (ability: AbilityName, value: number) => void;
  powerAbility?: AbilityName | undefined;
  martialAbility?: AbilityName | undefined;
  secondaryAbility?: AbilityName | undefined;
  className?: string | undefined;
}

export function GuidedAbilitiesCustomizePanel({
  abilities,
  totalPoints,
  spentPoints,
  onAbilityChange,
  powerAbility,
  martialAbility,
  secondaryAbility,
  className,
}: GuidedAbilitiesCustomizePanelProps) {
  const { rules } = useGameRules();
  const abilityPointsHelp = useMemo(() => getAbilityPointsHelp(1, rules), [rules]);

  return (
    <div className={className}>
      <div className="flex justify-center">
        <PointStatus
          total={totalPoints}
          spent={spentPoints}
          label={panelCopy.abilityPointsLabel}
          labelAccessory={<InfoTippy content={abilityPointsHelp} label="Ability point rules" />}
          variant="inline"
        />
      </div>

      <div className="mt-4 rounded-card border border-border-light bg-surface p-4 shadow-sm sm:p-5">
        <AbilityScoreEditor
          abilities={abilities}
          totalPoints={totalPoints}
          onAbilityChange={onAbilityChange}
          powerAbility={powerAbility}
          martialAbility={martialAbility}
          secondaryAbility={secondaryAbility}
          hidePointsStatus
          variant="sheet"
        />
      </div>
    </div>
  );
}
