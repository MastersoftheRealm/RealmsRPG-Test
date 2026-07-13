'use client';

import { SegmentedControl } from '@/components/shared';
import type { GuidedEquipmentPhase } from '@/stores/guided-creator-store';
import type { ArmorStepMode } from '@/lib/guided-creator/equipment-eligibility';
import {
  canNavigateToEquipmentPhase,
  visibleEquipmentPhases,
  type EquipmentPhaseCompletionContext,
} from '@/lib/guided-creator/equipment-phase-nav';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const phaseCopy = GUIDED_CREATOR_COPY.steps.loadout.phases;

export interface GuidedEquipmentPhaseProgressProps {
  value: GuidedEquipmentPhase;
  armorMode: ArmorStepMode;
  completion: EquipmentPhaseCompletionContext;
  onChange: (phase: GuidedEquipmentPhase) => void;
}

export function GuidedEquipmentPhaseProgress({
  value,
  armorMode,
  completion,
  onChange,
}: GuidedEquipmentPhaseProgressProps) {
  const phases = visibleEquipmentPhases(armorMode);

  const options = phases.map((phase, index) => {
    const canOpen = canNavigateToEquipmentPhase(phase, value, armorMode, completion);
    return {
      value: phase,
      label: `${index + 1}. ${phaseCopy.phaseNames[phase]}`,
      disabled: !canOpen,
    };
  });

  const lockedAhead = options.some((o) => o.disabled);

  return (
    <div className="space-y-2">
      <SegmentedControl
        value={value}
        onChange={onChange}
        options={options}
        aria-label={phaseCopy.progressLabel}
        equalWidth
        className="w-full"
      />
      {lockedAhead ? (
        <p className="font-nunito text-sm text-text-secondary" role="status">
          {phaseCopy.phaseLockedHint}
        </p>
      ) : null}
    </div>
  );
}
