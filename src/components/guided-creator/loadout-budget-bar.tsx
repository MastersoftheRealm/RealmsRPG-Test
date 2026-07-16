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
  /** Extra content above the PointStatus row (e.g. L2 confirm error). */
  children?: ReactNode;
}

/**
 * Shared Currency + Training Points PointStatus chrome for guided Loadout
 * (L1 phase layout, L2 modal footer, powers/techniques step).
 * Training Points help sits inside the PointStatus label (TASK-465).
 */
export function LoadoutBudgetBar({
  currencyTotal,
  currencySpent,
  tpTotal,
  tpSpent,
  currencyLabel = phaseCopy.currencyLabel,
  trainingPointsLabel = ptCopy.trainingPointsLabel,
  className,
  children,
}: LoadoutBudgetBarProps) {
  const showCurrency = currencyTotal != null && currencySpent != null;
  const showTp = tpTotal != null && tpSpent != null;
  if (!showCurrency && !showTp && !children) return null;

  const tpHelp = (
    <InfoTippy
      content={trainingPointsHelp}
      allowHTML
      label="Training Points help"
      size="inline"
      className="!min-h-6 !min-w-6 md:!min-h-5 md:!min-w-5 text-text-muted dark:text-text-secondary hover:text-primary-link-fg"
    />
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {children}
      {showCurrency || showTp ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {showCurrency ? (
            <PointStatus
              total={currencyTotal}
              spent={currencySpent}
              label={currencyLabel}
              variant="inline"
              className="text-base"
            />
          ) : null}
          {showTp ? (
            <PointStatus
              total={tpTotal}
              spent={tpSpent}
              label={trainingPointsLabel}
              labelAccessory={tpHelp}
              variant="inline"
              className="text-base"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
