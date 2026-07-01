/**

 * InfoTippy — canonical contextual help trigger (TASK-376 / TASK-392).

 *

 * Copy lives in `public/tooltip-text.tsx`. Uses Floating UI (React 19–safe).

 * Do not use HelpTooltip, ContextHelpTooltip, or the DB tooltip stack.

 */



'use client';



import {

  autoUpdate,

  flip,

  FloatingPortal,

  offset,

  safePolygon,

  shift,

  size as floatingSizeMiddleware,

  useDismiss,

  useFloating,

  useFocus,

  useHover,

  useInteractions,

  useRole,

} from '@floating-ui/react';

import { cloneElement, isValidElement, useCallback, useId, useRef, useState } from 'react';

import type { PointerEvent, ReactElement, ReactNode } from 'react';

import { Info } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { TooltipPlacement } from '@/types/tooltips';



const TOUCH_HOLD_MS = 400;

const MAX_WIDTH_PX = 320;



export interface InfoTippyProps {

  content: ReactNode;

  /** Accessible name for the trigger (required). */

  label: string;

  /** @deprecated JSX and strings render natively; kept for existing call sites. */

  allowHTML?: boolean;

  placement?: TooltipPlacement;

  /** `inline` = compact trigger aligned with step headings; `icon` = default touch-friendly trigger. */

  size?: 'inline' | 'icon';

  className?: string;

  /** Optional custom trigger element (must be a single DOM element). */

  children?: ReactElement;

  disabled?: boolean;

}



function TooltipBody({ content }: { content: ReactNode }) {

  if (typeof content === 'string') {

    return <span className="block text-sm text-text-secondary whitespace-pre-wrap">{content}</span>;

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

  size = 'icon',

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



  const { refs, floatingStyles, context } = useFloating({

    open,

    onOpenChange: (nextOpen) => {

      if (!nextOpen) clearTouchHold();

      setOpen(nextOpen);

    },

    placement,

    middleware: [

      offset(8),

      flip({ padding: 8 }),

      shift({ padding: 8 }),

      floatingSizeMiddleware({

        apply({ availableWidth, elements }) {

          Object.assign(elements.floating.style, {

            maxWidth: `${Math.min(MAX_WIDTH_PX, availableWidth)}px`,

          });

        },

      }),

    ],

    whileElementsMounted: autoUpdate,

  });



  const hover = useHover(context, {

    mouseOnly: true,

    move: false,

    handleClose: isInteractive ? safePolygon() : undefined,

  });

  const focus = useFocus(context);

  const dismiss = useDismiss(context);

  const role = useRole(context, { role: 'tooltip' });



  const { getReferenceProps, getFloatingProps } = useInteractions([

    hover,

    focus,

    dismiss,

    role,

  ]);



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



  const referenceProps = getReferenceProps(touchHoldProps);



  const triggerClassName = cn(

    'inline-flex items-center justify-center rounded-full shrink-0',

    size === 'inline'

      ? 'min-h-8 min-w-8 md:min-h-7 md:min-w-7 -my-0.5'

      : 'min-h-[var(--touch-target-min,44px)] min-w-[var(--touch-target-min,44px)] md:min-h-7 md:min-w-7',

    'text-primary-link-fg hover:text-primary-fg-hover',

    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2',

    className

  );



  const trigger = isValidElement(children) ? (

    cloneElement(

      children,

      getReferenceProps({

        ref: refs.setReference,

        ...touchHoldProps,

      })

    )

  ) : (

    <button

      ref={refs.setReference}

      type="button"

      aria-label={label}

      className={triggerClassName}

      {...referenceProps}

    >

      <Info className="w-4 h-4" aria-hidden />

    </button>

  );



  return (

    <>

      {trigger}

      {open && (

        <FloatingPortal>

          <div

            ref={refs.setFloating}

            id={tooltipId}

            style={floatingStyles}

            {...getFloatingProps({

              className: cn(

                'z-popover rounded-lg border border-border-light bg-surface p-3 shadow-xl text-left',

                isInteractive && 'pointer-events-auto'

              ),

            })}

          >

            <TooltipBody content={content} />

          </div>

        </FloatingPortal>

      )}

    </>

  );

}


