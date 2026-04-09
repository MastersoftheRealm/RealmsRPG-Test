/**
 * SegmentedControl — pill group toggle (Library My/Realms, source filter, modal tabs).
 * Matches library page and SourceFilter styling for a single visual language.
 */

'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  /** Optional id for aria-labelledby / tab semantics */
  id?: string;
  /** Optional leading icon (e.g. Lucide) */
  icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  /** Accessible name for the control group */
  'aria-label': string;
  className?: string;
  /** When true, uses tablist/tab roles (e.g. feat source tabs in a modal) */
  tabs?: boolean;
  /** When tabs: element id of the associated panel (shared panel is ok) */
  tabPanelId?: string;
  /** Stretch segments equally (e.g. two-column modal header) */
  equalWidth?: boolean;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
  className,
  tabs = false,
  tabPanelId,
  equalWidth = false,
}: SegmentedControlProps<T>) {
  const wrapperProps = tabs
    ? { role: 'tablist' as const, 'aria-label': ariaLabel }
    : { role: 'group' as const, 'aria-label': ariaLabel };

  return (
    <div
      {...wrapperProps}
      className={cn(
        // Keep pill groups compact; segments still enforce 44px touch target.
        'flex flex-wrap items-center gap-1 p-0.5 rounded-lg bg-surface-alt',
        equalWidth && 'w-full',
        className
      )}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        const baseBtn =
          // min-h maintains touch target; keep vertical padding tight so control doesn't feel "tall".
          'min-h-[44px] px-3 py-1 rounded text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background inline-flex items-center justify-center gap-2';
        const selectedCls =
          'bg-primary-600 text-white dark:bg-primary-100 dark:text-white';
        const idleCls =
          'text-text-secondary dark:text-text-primary hover:text-text-primary';
        const widthCls = equalWidth ? 'flex-1 min-w-0' : '';

        const inner = (
          <>
            {opt.icon ? <span className="shrink-0 [&_svg]:shrink-0">{opt.icon}</span> : null}
            <span className={cn(opt.icon && 'min-w-0 truncate')}>{opt.label}</span>
          </>
        );

        if (tabs) {
          return (
            <button
              key={opt.value}
              id={opt.id}
              type="button"
              role="tab"
              aria-selected={selected}
              {...(tabPanelId ? { 'aria-controls': tabPanelId } : {})}
              onClick={() => onChange(opt.value)}
              className={cn(baseBtn, widthCls, selected ? selectedCls : idleCls)}
            >
              {inner}
            </button>
          );
        }

        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={cn(baseBtn, widthCls, selected ? selectedCls : idleCls)}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
