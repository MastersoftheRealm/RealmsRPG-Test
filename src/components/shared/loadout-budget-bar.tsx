'use client';

import type { ReactNode } from 'react';
import { PointStatus, InfoTippy } from '@/components/shared';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { trainingPointsHelp } from '../../../public/tooltip-text';
import { cn } from '@/lib/utils';

const phaseCopy = GUIDED_CREATOR_COPY.steps.loadout.phases;
const ptCopy = GUIDED_CREATOR_COPY.steps.powersTechniques;

export interface LoadoutBudgetBarProps {
  /** Starting Currency (omit to hide Currency PointStatus). */
  currencyTotal?: number;
  /** Currency spent so far. */
  currencySpent?: number;
  /** Training Points limit. */
  tpTotal?: number;
  /** Training Points spent. */
  tpSpent?: number;
  currencyLabel?: string;
  trainingPointsLabel?: string;
  className?: string;
  /** Budget row alignment (Guided default center; Advanced equipment header uses end). */
  align?: 'center' | 'end';
  /** Extra PointStatus (or similar) before Currency/TP — e.g. Guided Powers Innate Energy. */
  leading?: ReactNode;
  /** Extra PointStatus (or similar) in the budget row — e.g. Advanced finalize Energy. */
  trailing?: ReactNode;
  /** Extra content above the PointStatus row (e.g. L2 confirm error). */
  children?: ReactNode;
}

/**
 * Shared Currency + Training Points PointStatus chrome for Guided Loadout
 * and Advanced creator equipment/powers/finalize (TASK-465 / TASK-606 / TASK-614 / TASK-706).
 * Optional `leading` / `trailing` PointStatus share the same inline variant. Training Points
 * help sits inside the PointStatus label.
 */
export function LoadoutBudgetBar({
  currencyTotal,
  currencySpent,
  tpTotal,
  tpSpent,
  currencyLabel = phaseCopy.currencyLabel,
  trainingPointsLabel = ptCopy.trainingPointsLabel,
  className,
  align = 'center',
  leading,
  trailing,
  children,
}: LoadoutBudgetBarProps) {
  const showCurrency = currencyTotal != null && currencySpent != null;
  const showTp = tpTotal != null && tpSpent != null;
  const showRow = showCurrency || showTp || leading != null || trailing != null;
  if (!showRow && !children) return null;

  const tpHelp = (
    <InfoTippy content={trainingPointsHelp} label="Training Points help" size="inline" tone="tp" />
  );

  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      role="status"
      aria-label="Character resources"
    >
      {children}
      {showRow ? (
        <div
          className={cn(
            'flex flex-wrap items-center gap-3',
            align === 'end' ? 'justify-end' : 'justify-center',
          )}
        >
          {leading}
          {showCurrency ? (
            <PointStatus
              total={currencyTotal}
              spent={currencySpent}
              label={currencyLabel}
              variant="inline"
            />
          ) : null}
          {showTp ? (
            <PointStatus
              total={tpTotal}
              spent={tpSpent}
              label={trainingPointsLabel}
              labelAccessory={tpHelp}
              variant="inline"
            />
          ) : null}
          {trailing}
        </div>
      ) : null}
    </div>
  );
}
