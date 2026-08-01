/**
 * GuidedLayerNav — unified Layer 1 ↔ 2/3 navigation (REALMS §3).
 *
 * **Placement:** Always below the step's primary content (never above).
 * **Expand:** Primary button — go deeper (same weight as footer Continue).
 * **Collapse:** Outline button — simpler view (same weight as footer Back).
 *
 * Matches GuidedChoiceShell + GuidedStepFooter; use on any guided step or creator surface.
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  guidedNavPreviousClassName,
  guidedNavProgressClassName,
} from './guided-nav-button-styles';

export interface GuidedLayerNavProps {
  /** Layer 1 → deeper: button label (e.g. "Customize scores"). */
  expandLabel?: string;
  onExpand?: () => void;
  /** Layer 2+ → simpler: button label (default "See recommendations"). */
  collapseLabel?: string;
  onCollapse?: () => void;
  className?: string;
}

export function GuidedLayerNav({
  expandLabel,
  onExpand,
  collapseLabel = 'See recommendations',
  onCollapse,
  className,
}: GuidedLayerNavProps) {
  if (!onExpand && !onCollapse) return null;

  return (
    <div className={cn('mt-5 flex flex-wrap items-center gap-3', className)}>
      {onExpand && expandLabel ? (
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onExpand}
          className={guidedNavProgressClassName}
        >
          {expandLabel}
        </Button>
      ) : null}
      {onCollapse ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onCollapse}
          className={guidedNavPreviousClassName}
        >
          {collapseLabel}
        </Button>
      ) : null}
    </div>
  );
}
