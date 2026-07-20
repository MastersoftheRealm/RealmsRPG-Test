/**
 * Cross-cutting resource bar for path-guided loadout steps (§5.9).
 * Training Points and Currency stay visible in Layer 1 (TASK-456).
 */

'use client';

import { cn } from '@/lib/utils';

export interface CreatorResourceBarProps {
  trainingPoints?: { spent: number; limit: number };
  currency?: { spent: number; limit: number };
  energy?: { current: number; max: number };
  className?: string;
}

export function CreatorResourceBar({
  trainingPoints,
  currency,
  energy,
  className,
}: CreatorResourceBarProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-wrap gap-3 rounded-xl border border-border-light bg-surface-alt px-4 py-3 text-sm',
        className
      )}
      role="status"
      aria-label="Character resources"
    >
      {trainingPoints && (
        <span className="text-text-secondary">
          <span className="font-semibold text-text-primary">Training Points:</span>{' '}
          {trainingPoints.spent} / {trainingPoints.limit}
        </span>
      )}
      {currency && (
        <span className="text-text-secondary">
          <span className="font-semibold text-text-primary">Currency:</span>{' '}
          {currency.limit - currency.spent} remaining
        </span>
      )}
      {energy && (
        <span className="text-text-secondary">
          <span className="font-semibold text-text-primary">Energy:</span>{' '}
          {energy.current} / {energy.max}
        </span>
      )}
    </div>
  );
}
