/**
 * Cross-cutting resource bar for path-guided loadout steps (§5.9).
 * Shown from equipment onward; "included in your path" framing in Layer 1.
 */

'use client';

import { cn } from '@/lib/utils';
import type { CreatorLayer } from '@/stores/character-creator-store';

export interface CreatorResourceBarProps {
  trainingPoints?: { spent: number; limit: number };
  currency?: { spent: number; limit: number };
  energy?: { current: number; max: number };
  layer?: CreatorLayer;
  creationMode?: 'path' | 'forge';
  className?: string;
}

export function CreatorResourceBar({
  trainingPoints,
  currency,
  energy,
  layer = 1,
  creationMode = 'path',
  className,
}: CreatorResourceBarProps) {
  const pathIncluded = creationMode === 'path' && layer === 1;

  return (
    <div
      className={cn(
        'mb-6 flex flex-wrap gap-3 rounded-xl border border-border-light bg-surface-alt px-4 py-3 text-sm',
        className
      )}
      role="status"
      aria-label="Character resources"
    >
      {pathIncluded && (
        <span className="w-full text-xs font-medium text-primary-fg mb-1">
          Included in your path — expand options to see Training Points and currency details.
        </span>
      )}
      {trainingPoints && (!pathIncluded || layer > 1) && (
        <span className="text-text-secondary">
          <span className="font-semibold text-text-primary">Training Points:</span>{' '}
          {trainingPoints.spent} / {trainingPoints.limit}
        </span>
      )}
      {currency && (!pathIncluded || layer > 1) && (
        <span className="text-text-secondary">
          <span className="font-semibold text-text-primary">Currency:</span>{' '}
          {currency.limit - currency.spent}c remaining
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
