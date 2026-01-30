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
 * - Ability Score Editor
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
      /** Inline badge style */
      inline: 'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm',
      /** Compact pill for tight spaces */
      compact: 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm',
    },
    status: {
      /** Points remaining to spend */
      remaining: 'bg-success-light text-success-700 border-success-200',
      /** All points spent (balanced) */
      balanced: 'bg-info-light text-info-700 border-info-200',
      /** Over budget */
      overspent: 'bg-danger-light text-danger-700 border-danger-200',
      /** Has points but some spent */
      partial: 'bg-primary-50 text-primary-700 border-primary-200',
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
  label?: string;
  /** Show the "Total - Spent = Remaining" breakdown (only for block variant) */
  showCalculation?: boolean;
  /** Additional className */
  className?: string;
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
  variant = 'inline',
  showCalculation = false,
  className,
}: PointStatusProps) {
  const remaining = total - spent;
  const status = getStatus(remaining);

  // Block variant with calculation breakdown
  if (variant === 'block') {
    return (
      <div className={cn(pointStatusVariants({ variant, status }), className)}>
        {showCalculation ? (
          <>
            <div className="text-center">
              <span className="text-xs text-text-muted block">Total</span>
              <span className="text-lg font-bold text-text-primary">{total}</span>
            </div>
            <span className="text-2xl text-neutral-300">−</span>
            <div className="text-center">
              <span className="text-xs text-text-muted block">Spent</span>
              <span className="text-lg font-bold text-text-primary">{spent}</span>
            </div>
            <span className="text-2xl text-neutral-300">=</span>
            <div className="text-center">
              <span className="text-xs text-text-muted block">Remaining</span>
              <span className={cn(
                'text-lg font-bold',
                status === 'overspent' && 'text-danger-600',
                status === 'balanced' && 'text-success-600',
                status === 'remaining' && 'text-primary-600'
              )}>
                {remaining}
              </span>
            </div>
          </>
        ) : (
          <span>
            {label && <span className="mr-1">{label}:</span>}
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
        {remaining} / {total}
      </span>
    );
  }

  // Inline variant (default)
  return (
    <span className={cn(pointStatusVariants({ variant, status }), className)}>
      {label && <span>{label}:</span>}
      <span className="font-bold">{remaining}</span>
      <span className="text-text-muted">/ {total}</span>
    </span>
  );
}

PointStatus.displayName = 'PointStatus';
