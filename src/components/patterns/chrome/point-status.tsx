/**
 * PointStatus Component
 * =====================
 * Unified display for point allocation status across the site.
 * Shows spent/remaining points with contextual coloring.
 *
 * Used in:
 * - Character Creator (ability points, skill points)
 * - Character Sheet edit mode (ability allocation)
 * - Creature Creator (point allocation)
 * - Ability Editor
 *
 * @example
 * // Block display with calculation breakdown
 * <PointStatus total={10} spent={7} showCalculation />
 *
 * // Inline compact display
 * <PointStatus total={10} spent={7} variant="inline" label="Points" />
 *
 * // Compact pill style
 * <PointStatus total={10} spent={10} variant="compact" />
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const pointStatusVariants = cva('font-semibold transition-colors', {
  variants: {
    variant: {
      /** Block layout with Total - Spent = Remaining breakdown */
      block: 'flex items-center justify-center gap-4 p-3 rounded-xl border',
      /** Inline badge — canonical creator tracker size (Skills / Abilities / LoadoutBudgetBar) */
      inline: 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-base',
      /** Compact pill for tight spaces */
      compact: 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm',
    },
    status: {
      /** Points remaining to spend */
      remaining: 'bg-success-light text-success-fg border-success-200',
      /** All points spent (balanced) */
      balanced: 'bg-info-light text-info-fg border-info-200',
      /** Over budget */
      overspent: 'bg-danger-light text-danger-fg border-danger-200',
      /** Has points but some spent */
      partial: 'bg-primary-subtle-bg text-primary-subtle-fg border-primary-subtle-border',
    },
  },
  defaultVariants: {
    variant: 'inline',
    status: 'partial',
  },
});

export interface PointStatusProps extends Omit<VariantProps<typeof pointStatusVariants>, 'status'> {
  /** Total points available */
  total: number;
  /** Points currently spent */
  spent: number;
  /** Optional label prefix */
  label?: string | undefined;
  /**
   * Optional content immediately after the label (inside the status pill),
   * e.g. InfoTippy for Training Points help (TASK-465).
   */
  labelAccessory?: React.ReactNode | undefined;
  /** Inline/compact: show spent vs remaining (default `remaining`) */
  metric?: 'remaining' | 'spent' | undefined;
  /** Show the "Total - Spent = Remaining" breakdown (only for block variant) */
  showCalculation?: boolean | undefined;
  /** Additional className */
  className?: string | undefined;
}

/**
 * Determine the status based on remaining points
 */
function getStatus(remaining: number): 'remaining' | 'balanced' | 'overspent' | 'partial' {
  if (remaining < 0) return 'overspent';
  if (remaining === 0) return 'balanced';
  return 'remaining';
}

/**
 * Unified point status display component.
 * Automatically colors based on remaining/spent points.
 */
export function PointStatus({
  total,
  spent,
  label,
  labelAccessory,
  metric = 'remaining',
  variant = 'inline',
  showCalculation = false,
  className,
}: PointStatusProps) {
  const remaining = total - spent;
  const status = getStatus(remaining);
  const displayValue = metric === 'spent' ? spent : remaining;

  const labelNode = label ? (
    <span className="mr-1 inline-flex items-center gap-0.5">
      <span>{label}</span>
      {labelAccessory}
      <span aria-hidden="true">:</span>
    </span>
  ) : null;

  // Block variant with calculation breakdown
  if (variant === 'block') {
    return (
      <div className={cn(pointStatusVariants({ variant, status }), className)}>
        {showCalculation ? (
          <>
            <div className="text-center">
              <span className="block text-xs text-text-secondary">Total</span>
              <span className="text-lg font-bold text-text-primary">{total}</span>
            </div>
            <span className="text-2xl text-border-light">−</span>
            <div className="text-center">
              <span className="block text-xs text-text-secondary">Spent</span>
              <span className="text-lg font-bold text-text-primary">{spent}</span>
            </div>
            <span className="text-2xl text-border-light">=</span>
            <div className="text-center">
              <span className="block text-xs text-text-secondary">Remaining</span>
              <span
                className={cn(
                  'text-lg font-bold',
                  status === 'overspent' && 'text-danger-fg',
                  status === 'balanced' && 'text-success-fg',
                  status === 'remaining' && 'text-primary-link-fg',
                )}
              >
                {remaining}
              </span>
            </div>
          </>
        ) : (
          <span>
            {labelNode}
            <span className="font-bold">{remaining}</span> / {total}
          </span>
        )}
      </div>
    );
  }

  // Compact variant - just numbers
  if (variant === 'compact') {
    return (
      <span className={cn(pointStatusVariants({ variant, status }), className)}>
        {displayValue} / {total}
      </span>
    );
  }

  // Inline variant (default)
  return (
    <span className={cn(pointStatusVariants({ variant, status }), className)}>
      {labelNode}
      <span className="font-bold">{displayValue}</span>
      <span className="font-normal">/ {total}</span>
    </span>
  );
}

PointStatus.displayName = 'PointStatus';
