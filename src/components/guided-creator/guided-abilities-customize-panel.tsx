/**
 * GuidedAbilitiesCustomizePanel — Layer 2 ability point-buy for the guided creator.
 * Matches GuidedSkillsPanel chrome: centered PointStatus + card-wrapped editor grid.
 * Layer navigation (back to recommendations) lives in the parent via GuidedLayerNav.
 */

'use client';

import { AbilityScoreEditor } from '@/components/creator';
import { PointStatus } from '@/components/shared';
import type { AbilityName, Abilities } from '@/types';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const panelCopy = GUIDED_CREATOR_COPY.steps.abilities;

export interface GuidedAbilitiesCustomizePanelProps {
  abilities: Abilities;
  totalPoints: number;
  spentPoints: number;
  onAbilityChange: (ability: AbilityName, value: number) => void;
  powerAbility?: AbilityName;
  martialAbility?: AbilityName;
  secondaryAbility?: AbilityName;
  className?: string;
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
  return (
    <div className={className}>
      <div className="flex justify-center">
        <PointStatus
          total={totalPoints}
          spent={spentPoints}
          label={panelCopy.abilityPointsLabel}
          variant="inline"
        />
      </div>

      <div className="mt-4 rounded-card border border-border-light bg-surface shadow-sm p-4 sm:p-5">
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
