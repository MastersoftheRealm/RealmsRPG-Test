'use client';

import type { ReactNode } from 'react';
import { GuidedLayerNav, LoadoutBudgetBar } from '@/components/patterns';

export interface GuidedEquipmentPhaseLayoutProps {
  children: ReactNode;
  /** Starting Currency for PointStatus (abilities/skills pattern). */
  currencyTotal?: number;
  /** Currency spent so far (weapons + armor + gear). */
  currencySpent?: number;
  /** Training Points limit (same pool L1/L2). */
  tpTotal?: number;
  /** Training Points spent on current loadout selections. */
  tpSpent?: number;
  expandLabel?: string;
  onExpand?: () => void;
  collapseLabel?: string;
  onCollapse?: () => void;
  trailingExpandLabel?: string;
  onTrailingExpand?: () => void;
}

/**
 * Phase body chrome only — page title/description live on GuidedStepLayout
 * (same pattern as ancestry pick screens).
 */
export function GuidedEquipmentPhaseLayout({
  children,
  currencyTotal,
  currencySpent,
  tpTotal,
  tpSpent,
  expandLabel,
  onExpand,
  collapseLabel,
  onCollapse,
  trailingExpandLabel,
  onTrailingExpand,
}: GuidedEquipmentPhaseLayoutProps) {
  return (
    <div className="space-y-3">
      <LoadoutBudgetBar
        currencyTotal={currencyTotal}
        currencySpent={currencySpent}
        tpTotal={tpTotal}
        tpSpent={tpSpent}
      />

      {children}

      <GuidedLayerNav
        expandLabel={expandLabel}
        onExpand={onExpand}
        collapseLabel={collapseLabel}
        onCollapse={onCollapse}
        trailingExpandLabel={trailingExpandLabel}
        onTrailingExpand={onTrailingExpand}
      />
    </div>
  );
}
