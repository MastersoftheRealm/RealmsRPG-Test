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

  const options = phases.map((phase) => ({
    value: phase,
    label: phaseCopy.labels[phase],
  }));

  const handleChange = (next: GuidedEquipmentPhase) => {
    if (
      !canNavigateToEquipmentPhase(next, value, armorMode, completion)
    ) {
      return;
    }
    onChange(next);
  };

  return (
    <SegmentedControl
      value={value}
      onChange={handleChange}
      options={options}
      aria-label={phaseCopy.progressLabel}
      equalWidth
      className="w-full"
    />
  );
}
