'use client';

/**
 * Styleguide/demo tooltip only. For contextual page help use `InfoTippy` from `@/components/shared`.
 *
 * Uses the same Floating UI primitives as InfoTippy (Collin PR #14) with configurable triggers.
 */

/* eslint-disable react-hooks/refs -- Floating UI positions with ref callbacks and arrow refs during render. */

import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { isValidElement, useMemo, useState } from 'react';
import {
  useClick,
  useDismiss,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { cn } from '@/lib/utils/cn';
import {
  FloatingHelpPanel,
  useFloatingHelpPopover,
} from '@/lib/tooltips/floating-help';
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
    <div className={cn('text-text-primary', className)}>
      {title && <div className="mb-1 text-xs font-semibold text-text-primary">{title}</div>}
      {typeof content === 'string' ? renderMarkdownLite(content) : content}
    </div>
  );
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
  const enabledInteractions = useMemo(() => getEnabledInteractions(trigger), [trigger]);
  const isInteractive = typeof content !== 'string';

  const {
    refs,
    floatingStyles,
    transitionStyles,
    isMounted,
    context,
    arrowRef,
  } = useFloatingHelpPopover({
    open,
    onOpenChange: setOpen,
    placement,
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
  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    click,
    dismiss,
    role,
  ]);

  const referenceProps = getReferenceProps({
    className: cn('inline-flex', className),
  }) as HTMLAttributes<HTMLSpanElement>;

  return (
    <>
      <span ref={refs.setReference} {...referenceProps}>
        {children}
      </span>
      <FloatingHelpPanel
        refs={refs}
        floatingStyles={floatingStyles}
        transitionStyles={transitionStyles}
        isMounted={isMounted}
        context={context}
        arrowRef={arrowRef}
        interactive={isInteractive}
        getFloatingProps={getFloatingProps}
      >
        <TooltipBody title={title} content={content} className={contentClassName} />
      </FloatingHelpPanel>
    </>
  );
}
