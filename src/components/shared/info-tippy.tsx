/**
 * InfoTippy — canonical contextual help trigger (TASK-376 / Collin Tippy standard).
 *
 * Copy lives in `public/tooltip-text.tsx`. Use this component for page/step help icons;
 * do not use HelpTooltip, ContextHelpTooltip, or the DB tooltip stack.
 */

'use client';

import type { ReactElement, ReactNode } from 'react';
import Tippy from '@tippyjs/react';
import type { Placement } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InfoTippyProps {
  content: ReactNode;
  /** Accessible name for the trigger (required). */
  label: string;
  allowHTML?: boolean;
  placement?: Placement;
  /** `inline` = compact trigger aligned with step headings; `icon` = default touch-friendly trigger. */
  size?: 'inline' | 'icon';
  className?: string;
  /** Optional custom trigger element (must accept a ref). */
  children?: ReactElement;
  disabled?: boolean;
}

export function InfoTippy({
  content,
  label,
  allowHTML = false,
  placement = 'top',
  size = 'icon',
  className,
  children,
  disabled = false,
}: InfoTippyProps) {
  if (disabled || content == null || content === '') {
    return children ?? null;
  }

  const trigger =
    children ??
    (
      <button
        type="button"
        aria-label={label}
        className={cn(
          'inline-flex items-center justify-center rounded-full shrink-0',
          size === 'inline'
            ? 'min-h-8 min-w-8 md:min-h-7 md:min-w-7 -my-0.5'
            : 'min-h-[var(--touch-target-min,44px)] min-w-[var(--touch-target-min,44px)] md:min-h-7 md:min-w-7',
          'text-primary-link-fg hover:text-primary-fg-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2',
          className
        )}
      >
        <Info className="w-4 h-4" aria-hidden />
      </button>
    );

  return (
    <Tippy
      content={content}
      placement={placement}
      allowHTML={allowHTML}
      touch={['hold', 400]}
      maxWidth={320}
      appendTo={() => document.body}
      interactive={typeof content !== 'string'}
    >
      {trigger}
    </Tippy>
  );
}
