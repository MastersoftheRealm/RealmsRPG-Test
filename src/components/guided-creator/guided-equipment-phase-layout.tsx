'use client';

import type { ReactNode } from 'react';
import { GuidedLayerNav, PointStatus } from '@/components/shared';
import type { GuidedEquipmentPhase } from '@/stores/guided-creator-store';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const phaseCopy = GUIDED_CREATOR_COPY.steps.loadout.phases;

export interface GuidedEquipmentPhaseLayoutProps {
  phase: GuidedEquipmentPhase;
  children: ReactNode;
  /** Starting Currency for PointStatus (abilities/skills pattern). */
  currencyTotal?: number;
  /** Currency spent so far (weapons + armor + gear). */
  currencySpent?: number;
  expandLabel?: string;
  onExpand?: () => void;
  collapseLabel?: string;
  onCollapse?: () => void;
}

export function GuidedEquipmentPhaseLayout({
  phase,
  children,
  currencyTotal,
  currencySpent,
  expandLabel,
  onExpand,
  collapseLabel,
  onCollapse,
}: GuidedEquipmentPhaseLayoutProps) {
  const copy = phaseCopy[phase];
  const showCurrency = currencyTotal != null && currencySpent != null;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display text-lg font-semibold text-text-primary">{copy.title}</h3>
        <p className="mt-0.5 font-nunito text-sm text-text-secondary leading-snug">
          {copy.description}
        </p>
      </div>

      {showCurrency ? (
        <div className="flex justify-center">
          <PointStatus
            total={currencyTotal}
            spent={currencySpent}
            label={phaseCopy.currencyLabel}
            variant="inline"
            className="text-base"
          />
        </div>
      ) : null}

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
