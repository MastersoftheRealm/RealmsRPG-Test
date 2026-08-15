/**
 * InfoTippy — canonical contextual help trigger (TASK-376 / TASK-392).
 *
 * Copy lives in `public/tooltip-text.tsx`. Uses shared Floating UI primitives
 * (Collin PR #14 polish + touch-hold / safePolygon for product help).
 * Do not use HelpTooltip, ContextHelpTooltip, or the DB tooltip stack.
 */

'use client';

import {
  safePolygon,
  useDismiss,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { cloneElement, isValidElement, useCallback, useId, useRef, useState } from 'react';
import type { PointerEvent, ReactElement, ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FloatingHelpPanel, useFloatingHelpPopover } from '@/lib/tooltips/floating-help';
import type { TooltipPlacement } from '@/types/tooltips';

const TOUCH_HOLD_MS = 400;

/** Icon color. Default `info` is primary-link blue; use `tp` / `current` on colored surfaces. */
export type InfoTippyTone = 'info' | 'tp' | 'current';

const TONE_CLASS: Record<InfoTippyTone, string> = {
  info: 'text-primary-link-fg hover:text-primary-fg-hover',
  tp: 'text-tp-text hover:text-tp',
  current: 'text-current',
};

export interface InfoTippyProps {
  content: ReactNode;
  /** Accessible name for the trigger (required). */
  label: string;
  /** @deprecated JSX and strings render natively; kept for existing call sites. */
  allowHTML?: boolean;
  placement?: TooltipPlacement;
  /** @deprecated No-op; layout is always the 16px icon + overlay hit (TASK-725). Kept for existing call sites. */
  size?: 'inline' | 'icon';
  /** Trigger icon color. Default `info` (link blue). Prefer this over one-off `text-*` class fights. */
  tone?: InfoTippyTone;
  className?: string;
  /** Optional custom trigger element (must be a single DOM element). */
  children?: ReactElement;
  disabled?: boolean;
}

function TooltipBody({ content }: { content: ReactNode }) {
  if (typeof content === 'string') {
    return <span className="block text-sm whitespace-pre-wrap text-text-secondary">{content}</span>;
  }

  return (
    <div className="text-sm text-text-secondary [&_strong]:font-semibold [&_strong]:text-text-primary [&_ul]:mt-1.5 [&_ul]:list-disc [&_ul]:space-y-0.5 [&_ul]:pl-4">
      {content}
    </div>
  );
}

export function InfoTippy({
  content,
  label,
  placement = 'top',
  tone = 'info',
  className,
  children,
  disabled = false,
}: InfoTippyProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const touchHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInteractive = typeof content !== 'string';

  const clearTouchHold = useCallback(() => {
    if (touchHoldTimerRef.current) {
      clearTimeout(touchHoldTimerRef.current);
      touchHoldTimerRef.current = null;
    }
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) clearTouchHold();
      setOpen(nextOpen);
    },
    [clearTouchHold],
  );

  const { refs, floatingStyles, transitionStyles, isMounted, context, arrowRef } =
    useFloatingHelpPopover({
      open,
      onOpenChange: handleOpenChange,
      placement,
    });

  const hover = useHover(context, {
    mouseOnly: true,
    move: false,
    delay: { open: 100, close: 0 },
    handleClose: isInteractive ? safePolygon() : undefined,
  });
  const focus = useFocus(context, { visibleOnly: false });
  const dismiss = useDismiss(context, { escapeKey: true, outsidePress: true });
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  const touchHoldProps = {
    'aria-describedby': open ? tooltipId : undefined,
    onPointerDown(event: PointerEvent) {
      if (event.pointerType === 'touch') {
        clearTouchHold();
        touchHoldTimerRef.current = setTimeout(() => setOpen(true), TOUCH_HOLD_MS);
      }
    },
    onPointerUp: clearTouchHold,
    onPointerCancel: clearTouchHold,
    onPointerLeave: clearTouchHold,
  };

  if (disabled || content == null || content === '') {
    return children ?? null;
  }

  // Floating UI merges ref callbacks into props; intended during render (not a stale-ref read).
  // eslint-disable-next-line react-hooks/refs -- getReferenceProps ref merge is the documented pattern
  const referenceProps = getReferenceProps(touchHoldProps);

  const triggerClassName = cn(
    'inline-flex size-4 shrink-0 items-center justify-center rounded-full hit-area-layout-neutral',
    TONE_CLASS[tone],
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2',
    className,
  );

  const trigger = isValidElement(children) ? (
    cloneElement(
      children,
      // eslint-disable-next-line react-hooks/refs -- Floating UI reference prop merge during render
      getReferenceProps({
        ref: refs.setReference,
        ...touchHoldProps,
      }),
    )
  ) : (
    <button
      ref={refs.setReference}
      type="button"
      aria-label={label}
      className={triggerClassName}
      {...referenceProps}
    >
      <Info className="h-4 w-4" aria-hidden />
    </button>
  );

  return (
    <>
      {trigger}
      <FloatingHelpPanel
        id={tooltipId}
        refs={refs}
        floatingStyles={floatingStyles}
        transitionStyles={transitionStyles}
        isMounted={isMounted}
        context={context}
        arrowRef={arrowRef}
        interactive={isInteractive}
        getFloatingProps={getFloatingProps}
      >
        <TooltipBody content={content} />
      </FloatingHelpPanel>
    </>
  );
}

export interface WordHelpTipProps {
  content: ReactNode;
  /** Accessible name for the word trigger (required). */
  label: string;
  /** Visible label text (or short/full name spans). */
  children: ReactNode;
  className?: string;
  placement?: TooltipPlacement;
  disabled?: boolean;
  /**
   * Dense table/list labels: 44px below `md`, hug the word on desktop.
   * Default keeps a 44px target (ability tiles).
   */
  compact?: boolean;
}

// DESIGN_INTENT: Definition help on the word itself (not an Info icon sibling).
// Default 44px target (ability tiles); compact uses touch-target-md-compact.
/** Word-tied contextual help for ability/defense/skill names (sheet + guided creator). */
export function WordHelpTip({
  content,
  label,
  children,
  className,
  placement = 'top',
  disabled = false,
  compact = false,
}: WordHelpTipProps) {
  return (
    <InfoTippy content={content} label={label} placement={placement} disabled={disabled}>
      <button
        type="button"
        aria-label={label}
        className={cn(
          'inline-flex cursor-help items-center rounded-sm',
          compact
            ? 'touch-target-md-compact justify-start px-0'
            : 'min-h-[var(--touch-target-min,44px)] min-w-[var(--touch-target-min,44px)] justify-center px-1',
          'font-inherit leading-inherit tracking-inherit m-0 border-0 bg-transparent p-0 text-inherit',
          'focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2 focus-visible:outline-none',
          className,
        )}
      >
        {children}
      </button>
    </InfoTippy>
  );
}
