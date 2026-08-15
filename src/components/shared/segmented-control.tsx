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
  /** When true, segment is non-interactive and visually muted */
  disabled?: boolean;
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
        // Track + bordered idle segments so options read as distinct choices before selection.
        // Hug the pills unless equalWidth stretches the group (TASK-720 size pickers).
        'flex-wrap items-center gap-1 rounded-lg border border-border-light bg-surface-alt p-1',
        equalWidth ? 'flex w-full' : 'inline-flex w-fit max-w-full',
        className,
      )}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        const disabled = opt.disabled === true;
        const baseBtn =
          // min-h maintains touch target; keep vertical padding tight so control doesn't feel "tall".
          'min-h-[44px] px-3 py-1 rounded text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2 focus-visible:ring-offset-background inline-flex items-center justify-center gap-2 border';
        const selectedCls =
          'bg-primary-button text-text-on-dark border-primary-button hover:bg-primary-button-hover';
        const idleCls =
          'bg-surface text-text-secondary border-border-light hover:text-text-primary hover:border-border';
        const disabledCls =
          'bg-surface-alt text-text-muted border-border-light opacity-60 cursor-not-allowed hover:text-text-muted dark:hover:text-text-secondary hover:border-border-light';
        const widthCls = equalWidth ? 'flex-1 min-w-0' : '';

        const inner = (
          <>
            {opt.icon ? <span className="shrink-0 [&_svg]:shrink-0">{opt.icon}</span> : null}
            <span className={cn(opt.icon && 'min-w-0 truncate')}>{opt.label}</span>
          </>
        );

        const classNameBtn = cn(
          baseBtn,
          widthCls,
          disabled ? disabledCls : selected ? selectedCls : idleCls,
        );

        if (tabs) {
          return (
            <button
              key={opt.value}
              id={opt.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-disabled={disabled || undefined}
              disabled={disabled}
              {...(tabPanelId ? { 'aria-controls': tabPanelId } : {})}
              onClick={() => {
                if (disabled) return;
                onChange(opt.value);
              }}
              className={classNameBtn}
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
            aria-disabled={disabled || undefined}
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              onChange(opt.value);
            }}
            className={classNameBtn}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
