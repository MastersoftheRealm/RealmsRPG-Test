'use client';

/* eslint-disable react-hooks/refs -- Floating UI positions with ref callbacks and arrow refs during render. */

import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { isValidElement, useMemo, useRef, useState } from 'react';
import {
  FloatingArrow,
  FloatingPortal,
  arrow as arrowMiddleware,
  autoUpdate,
  flip,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles,
} from '@floating-ui/react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { renderMarkdownLite } from '@/lib/tooltips/markdown-lite';
import type { TooltipPlacement, TooltipTrigger } from '@/types/tooltips';

interface TooltipProps {
  title?: string | null;
  content: ReactNode;
  placement?: TooltipPlacement;
  trigger?: TooltipTrigger;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  children: ReactElement<{ className?: string }>;
}

function hasTooltipContent(content: ReactNode): boolean {
  if (content == null || content === false) return false;
  if (typeof content === 'string') return content.trim().length > 0;
  return true;
}

function TooltipBody({
  title,
  content,
  className,
}: {
  title?: string | null;
  content: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-[220px] max-w-[320px] p-3 text-text-primary', className)}>
      {title && <div className="mb-1 text-xs font-semibold text-text-primary">{title}</div>}
      {typeof content === 'string' ? renderMarkdownLite(content) : content}
    </div>
  );
}

function getFallbackPlacement(placement: TooltipPlacement): TooltipPlacement[] {
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

function getEnabledInteractions(trigger: TooltipTrigger) {
  return {
    hover: trigger === 'auto' || trigger === 'hover',
    focus: trigger === 'auto' || trigger === 'hover' || trigger === 'focus',
    click: trigger === 'auto' || trigger === 'click',
  };
}

export function Tooltip({
  title,
  content,
  placement = 'top',
  trigger = 'auto',
  className,
  contentClassName,
  disabled = false,
  children,
}: TooltipProps) {
  if (disabled || !hasTooltipContent(content)) {
    return children;
  }

  if (!isValidElement(children)) {
    return children;
  }

  return (
    <FloatingTooltip
      title={title}
      content={content}
      placement={placement}
      trigger={trigger}
      className={className}
      contentClassName={contentClassName}
    >
      {children}
    </FloatingTooltip>
  );
}

function FloatingTooltip({
  title,
  content,
  placement,
  trigger,
  className,
  contentClassName,
  children,
}: Required<Pick<TooltipProps, 'placement' | 'trigger' | 'children'>> &
  Pick<TooltipProps, 'title' | 'content' | 'className' | 'contentClassName'>) {
  const [open, setOpen] = useState(false);
  const arrowRef = useRef<SVGSVGElement | null>(null);
  const enabledInteractions = useMemo(() => getEnabledInteractions(trigger), [trigger]);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({ fallbackPlacements: getFallbackPlacement(placement) }),
      shift({ padding: 8 }),
      arrowMiddleware({ element: arrowRef, padding: 8 }),
    ],
  });

  const hover = useHover(context, {
    enabled: enabledInteractions.hover,
    delay: { open: 100, close: 0 },
    move: false,
  });
  const focus = useFocus(context, {
    enabled: enabledInteractions.focus,
    visibleOnly: false,
  });
  const click = useClick(context, {
    enabled: enabledInteractions.click,
  });
  const dismiss = useDismiss(context, {
    escapeKey: true,
    outsidePress: true,
  });
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, click, dismiss, role]);
  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: { open: 150, close: 100 },
    initial: { opacity: 0 },
    open: { opacity: 1 },
    close: { opacity: 0 },
  });

  const referenceProps = getReferenceProps({
    className: cn('inline-flex', className),
  }) as HTMLAttributes<HTMLSpanElement>;
  const floatingProps = getFloatingProps({
    className: cn(
      'z-[10000] rounded-lg border border-border-light bg-surface text-text-primary shadow-xl',
      'outline-none will-change-opacity'
    ),
    style: { ...floatingStyles, ...transitionStyles } as CSSProperties,
  }) as HTMLAttributes<HTMLDivElement>;

  return (
    <>
      <span ref={refs.setReference} {...referenceProps}>
        {children}
      </span>
      {isMounted && (
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
            <TooltipBody title={title} content={content} className={contentClassName} />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}

interface HelpTooltipProps {
  title?: string | null;
  content: ReactNode;
  placement?: TooltipPlacement;
  trigger?: TooltipTrigger;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function HelpTooltip({
  title,
  content,
  placement = 'top',
  trigger = 'auto',
  label = 'Help information',
  className,
  disabled = false,
}: HelpTooltipProps) {
  return (
    <Tooltip
      title={title}
      content={content}
      placement={placement}
      trigger={trigger}
      className={className}
      disabled={disabled}
    >
      <button
        type="button"
        aria-label={label}
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'min-w-[var(--touch-target-min,44px)] min-h-[var(--touch-target-min,44px)] md:min-w-[28px] md:min-h-[28px]',
          'text-primary-link-fg hover:text-primary-fg-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border'
        )}
      >
        <Info className="w-4 h-4" />
      </button>
    </Tooltip>
  );
}
