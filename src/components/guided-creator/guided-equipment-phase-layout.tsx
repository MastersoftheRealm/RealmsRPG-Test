'use client';

import type { ReactNode } from 'react';
import { GuidedLayerNav, PointStatus } from '@/components/shared';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const phaseCopy = GUIDED_CREATOR_COPY.steps.loadout.phases;

export interface GuidedEquipmentPhaseLayoutProps {
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

/**
 * Phase body chrome only — page title/description live on GuidedStepLayout
 * (same pattern as ancestry pick screens).
 */
export function GuidedEquipmentPhaseLayout({
  children,
  currencyTotal,
  currencySpent,
  expandLabel,
  onExpand,
  collapseLabel,
  onCollapse,
}: GuidedEquipmentPhaseLayoutProps) {
  const showCurrency = currencyTotal != null && currencySpent != null;

  return (
    <div className="space-y-3">
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
