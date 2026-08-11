/**
 * GuidedLayerNav — unified Layer 1 ↔ 2/3 navigation (REALMS §3).
 *
 * **Placement:** Always below the step's primary content (never in the sticky footer).
 * **Layout:** One action → bottom left; two actions → shallower (collapse) left, deeper (expand) right.
 * **Expand:** Hatch button — go deeper (subtle fill; not footer Continue primary).
 * **Collapse:** Outline button — simpler view (same weight as footer Back).
 *
 * Collapse uses outline (transparent); expand uses outline + subtle hatch fill.
 * Footer Continue remains the sole solid primary progress CTA (GuidedStepFooter).
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  guidedNavExpandClassName,
  guidedNavPreviousClassName,
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
  const hasExpand = Boolean(onExpand && expandLabel);
  const hasCollapse = Boolean(onCollapse);
  if (!hasExpand && !hasCollapse) return null;

  const singleAction = hasExpand !== hasCollapse;

  return (
    <div
      className={cn(
        'mt-5 flex w-full items-center gap-3',
        singleAction ? 'justify-start' : 'justify-between',
        className
      )}
    >
      {hasCollapse ? (
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
      {hasExpand ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onExpand}
          className={guidedNavExpandClassName}
        >
          {expandLabel}
        </Button>
      ) : null}
    </div>
  );
}
