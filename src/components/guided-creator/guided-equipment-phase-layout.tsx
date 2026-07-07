'use client';

import type { ReactNode } from 'react';
import { GuidedLayerNav } from '@/components/shared';
import type { GuidedEquipmentPhase } from '@/stores/guided-creator-store';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const phaseCopy = GUIDED_CREATOR_COPY.steps.loadout.phases;

export interface GuidedEquipmentPhaseLayoutProps {
  phase: GuidedEquipmentPhase;
  children: ReactNode;
  /** Remaining currency — shown on gear phase when provided. */
  currencyRemaining?: number;
  expandLabel?: string;
  onExpand?: () => void;
  collapseLabel?: string;
  onCollapse?: () => void;
}

export function GuidedEquipmentPhaseLayout({
  phase,
  children,
  currencyRemaining,
  expandLabel,
  onExpand,
  collapseLabel,
  onCollapse,
}: GuidedEquipmentPhaseLayoutProps) {
  const copy = phaseCopy[phase];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold text-text-primary">{copy.title}</h3>
        <p className="mt-1 font-nunito text-sm text-text-secondary leading-relaxed">
          {copy.description}
        </p>
        {phase === 'gear' && currencyRemaining != null ? (
          <p className="mt-2 font-nunito text-sm font-medium text-text-primary">
            {phaseCopy.currencyRemaining(currencyRemaining)}
          </p>
        ) : null}
      </div>

      {children}

      <GuidedLayerNav
        expandLabel={expandLabel}
        onExpand={onExpand}
        collapseLabel={collapseLabel}
        onCollapse={onCollapse}
      />
    </div>
  );
}
