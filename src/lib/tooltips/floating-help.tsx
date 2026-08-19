'use client';

/**
 * Shared Floating UI panel + placement helpers for contextual help.
 *
 * Lineage: Collin PR #14 (`286064c6`) — Tippy removal, flip/shift/arrow, fallback
 * placements. Refactored here during KadinBranch merge so `InfoTippy` and
 * `@/components/ui/tooltip` share one implementation.
 *
 * Onboarding: `src/lib/tooltips/README.md`
 */

/* eslint-disable react-hooks/refs -- Floating UI positions with ref callbacks and arrow refs during render. */

import {
  FloatingArrow,
  FloatingPortal,
  arrow as arrowMiddleware,
  autoUpdate,
  flip,
  offset,
  shift,
  size as floatingSizeMiddleware,
  useFloating,
  useTransitionStyles,
  type Placement,
} from '@floating-ui/react';
import { useRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { TooltipPlacement } from '@/types/tooltips';

export const FLOATING_HELP_MAX_WIDTH_PX = 320;
export const FLOATING_HELP_MIN_WIDTH_PX = 220;

/** Collin's fallback placement order — keeps tooltips on-screen near edges. */
export function getTooltipFallbackPlacements(placement: TooltipPlacement): Placement[] {
  switch (placement) {
    case 'left':
      return ['right', 'top', 'bottom'];
    case 'right':
      return ['left', 'top', 'bottom'];
    case 'bottom':
      return ['top', 'right', 'left'];
    case 'top':
    default:
      return ['bottom', 'right', 'left'];
  }
}

export function useFloatingHelpPopover({
  open,
  onOpenChange,
  placement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placement: TooltipPlacement;
}) {
  const arrowRef = useRef<SVGSVGElement | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ fallbackPlacements: getTooltipFallbackPlacements(placement) }),
      shift({ padding: 8 }),
      arrowMiddleware({ element: arrowRef, padding: 8 }),
      floatingSizeMiddleware({
        apply({ availableWidth, elements }) {
          Object.assign(elements.floating.style, {
            maxWidth: `${Math.min(FLOATING_HELP_MAX_WIDTH_PX, availableWidth)}px`,
            minWidth: `${FLOATING_HELP_MIN_WIDTH_PX}px`,
          });
        },
      }),
    ],
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: { open: 150, close: 100 },
    initial: { opacity: 0 },
    open: { opacity: 1 },
    close: { opacity: 0 },
  });

  return {
    refs,
    floatingStyles,
    transitionStyles,
    isMounted,
    context,
    arrowRef,
  };
}

export interface FloatingHelpPanelProps {
  id?: string | undefined;
  refs: ReturnType<typeof useFloatingHelpPopover>['refs'];
  floatingStyles: CSSProperties;
  transitionStyles: CSSProperties;
  isMounted: boolean;
  context: ReturnType<typeof useFloatingHelpPopover>['context'];
  arrowRef: ReturnType<typeof useFloatingHelpPopover>['arrowRef'];
  interactive?: boolean | undefined;
  className?: string | undefined;
  getFloatingProps: (userProps?: HTMLAttributes<HTMLDivElement>) => Record<string, unknown>;
  children: ReactNode;
}

/** Shared popover chrome: portal, arrow, fade transition, design-system z-index. */
export function FloatingHelpPanel({
  id,
  refs,
  floatingStyles,
  transitionStyles,
  isMounted,
  context,
  arrowRef,
  interactive = false,
  className,
  getFloatingProps,
  children,
}: FloatingHelpPanelProps) {
  if (!isMounted) return null;

  const floatingProps = getFloatingProps({
    id,
    className: cn(
      'z-popover rounded-lg border border-border-light bg-surface text-text-primary shadow-xl text-left',
      'outline-none will-change-opacity p-3',
      interactive && 'pointer-events-auto',
      className,
    ),
    style: { ...floatingStyles, ...transitionStyles } as CSSProperties,
  }) as HTMLAttributes<HTMLDivElement>;

  return (
    <FloatingPortal>
      <div ref={refs.setFloating} {...floatingProps}>
        <FloatingArrow
          ref={arrowRef}
          context={context}
          width={14}
          height={7}
          tipRadius={2}
          fill="var(--color-surface)"
          stroke="var(--color-border-light)"
          strokeWidth={1}
        />
        {children}
      </div>
    </FloatingPortal>
  );
}
