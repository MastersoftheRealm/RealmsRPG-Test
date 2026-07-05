/**
 * GuidedLayerNav — unified Layer 1 ↔ 2/3 navigation (REALMS §3).
 *
 * **Placement:** Always below the step's primary content (never above).
 * **Expand:** Outline button — go deeper (customize, show all, see more).
 * **Collapse:** Secondary button — return to recommendations / simpler view (same slot, lighter than expand).
 *
 * Matches GuidedChoiceShell; use on any guided step or creator surface.
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

export interface GuidedLayerNavProps {
  /** Layer 1 → deeper: outline button label (e.g. "Customize scores"). */
  expandLabel?: string;
  onExpand?: () => void;
  /** Layer 2+ → simpler: button label (default "Back to recommendations"). */
  collapseLabel?: string;
  onCollapse?: () => void;
  className?: string;
}

export function GuidedLayerNav({
  expandLabel,
  onExpand,
  collapseLabel = 'Back to recommendations',
  onCollapse,
  className,
}: GuidedLayerNavProps) {
  if (!onExpand && !onCollapse) return null;

  return (
    <div className={cn('mt-5 flex flex-wrap items-center gap-3', className)}>
      {onExpand && expandLabel ? (
        <Button type="button" variant="outline" size="sm" onClick={onExpand} className="min-h-11">
          {expandLabel}
        </Button>
      ) : null}
      {onCollapse ? (
        <Button type="button" variant="secondary" size="sm" onClick={onCollapse} className="min-h-11">
          ← {collapseLabel}
        </Button>
      ) : null}
    </div>
  );
}
