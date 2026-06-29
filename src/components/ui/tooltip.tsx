'use client';

import { cloneElement, isValidElement, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { renderMarkdownLite } from '@/lib/tooltips/markdown-lite';
import type { TooltipPlacement, TooltipTrigger } from '@/types/tooltips';

interface TooltipProps {
  title?: string | null;
  content: string;
  placement?: TooltipPlacement;
  trigger?: TooltipTrigger;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  children: ReactElement<{ className?: string }>;
}

const MOBILE_BREAKPOINT = 768;

function getPlacementClasses(placement: TooltipPlacement): string {
  switch (placement) {
    case 'bottom':
      return 'top-full mt-2 left-1/2 -translate-x-1/2';
    case 'left':
      return 'right-full mr-2 top-1/2 -translate-y-1/2';
    case 'right':
      return 'left-full ml-2 top-1/2 -translate-y-1/2';
    case 'top':
    default:
      return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
  }
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
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipId = useId();
  const wrapperRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const effectiveTrigger = useMemo<TooltipTrigger>(() => {
    if (trigger !== 'auto') return trigger;
    return isMobile ? 'click' : 'hover';
  }, [trigger, isMobile]);

  if (disabled || !content.trim()) {
    return children;
  }

  if (!isValidElement(children)) {
    return children;
  }

  const childProps: Record<string, unknown> = {
    'aria-describedby': open ? tooltipId : undefined,
    onFocus: (event: unknown) => {
      if (effectiveTrigger === 'focus' || effectiveTrigger === 'hover') setOpen(true);
      (children.props as Record<string, (event: unknown) => void>).onFocus?.(event);
    },
    onBlur: (event: unknown) => {
      if (effectiveTrigger === 'focus' || effectiveTrigger === 'hover') setOpen(false);
      (children.props as Record<string, (event: unknown) => void>).onBlur?.(event);
    },
    onMouseEnter: (event: unknown) => {
      if (effectiveTrigger === 'hover') setOpen(true);
      (children.props as Record<string, (event: unknown) => void>).onMouseEnter?.(event);
    },
    onMouseLeave: (event: unknown) => {
      if (effectiveTrigger === 'hover') setOpen(false);
      (children.props as Record<string, (event: unknown) => void>).onMouseLeave?.(event);
    },
    onClick: (event: unknown) => {
      if (effectiveTrigger === 'click') {
        if (event && typeof event === 'object' && 'preventDefault' in event) {
          (event as { preventDefault: () => void }).preventDefault();
        }
        setOpen((prev) => !prev);
      }
      (children.props as Record<string, (event: unknown) => void>).onClick?.(event);
    },
  };

  return (
    <span ref={wrapperRef} className={cn('relative inline-flex', className)}>
      {cloneElement(children, childProps)}
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute z-popover min-w-[220px] max-w-[320px] rounded-lg border border-border-light bg-surface p-3 shadow-xl',
            getPlacementClasses(placement),
            contentClassName
          )}
        >
          {title && <span className="block text-xs font-semibold text-text-primary mb-1">{title}</span>}
          {renderMarkdownLite(content)}
        </span>
      )}
    </span>
  );
}

