/**
 * SegmentedControl — pill group toggle (Library My/Realms, source filter, modal tabs).
 * Default size matches library page and SourceFilter. `size="compact"` is the
 * lighter sheet-toolbar variant (TASK-778).
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
  /**
   * `default` matches SourceFilter / Library chrome (44px segments).
   * `compact` is for dense sheet toolbars: text-hugging on md+, 44px below md (TASK-778).
   */
  size?: 'default' | 'compact';
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
  size = 'default',
}: SegmentedControlProps<T>) {
  const compact = size === 'compact';
  const wrapperProps = tabs
    ? { role: 'tablist' as const, 'aria-label': ariaLabel }
    : { role: 'group' as const, 'aria-label': ariaLabel };

  return (
    <div
      {...wrapperProps}
      className={cn(
        // Track + bordered idle segments so options read as distinct choices before selection.
        // Hug the pills unless equalWidth stretches the group (TASK-720 size pickers).
        'flex-wrap items-center border border-border-light bg-surface-alt',
        compact ? 'gap-0.5 rounded-md p-0.5' : 'gap-1 rounded-lg p-1',
        equalWidth ? 'flex w-full' : 'inline-flex w-fit max-w-full',
        className,
      )}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        const disabled = opt.disabled === true;
        const classNameBtn = cn(
          'inline-flex items-center justify-center rounded border font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-outline-border focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          compact
            ? 'touch-target-md-compact gap-1.5 px-2 py-0.5 text-xs'
            : 'min-h-[44px] gap-2 px-3 py-1 text-sm',
          equalWidth && 'min-w-0 flex-1',
          disabled
            ? 'cursor-not-allowed border-border-light bg-surface-alt text-text-muted opacity-60 hover:border-border-light hover:text-text-muted'
            : selected
              ? 'border-primary-button bg-primary-button text-text-on-dark hover:bg-primary-button-hover'
              : 'border-border-light bg-surface text-text-secondary hover:border-border hover:text-text-primary',
        );

        return (
          <button
            key={opt.value}
            id={opt.id}
            type="button"
            {...(tabs
              ? {
                  role: 'tab' as const,
                  'aria-selected': selected,
                  ...(tabPanelId ? { 'aria-controls': tabPanelId } : {}),
                }
              : { 'aria-pressed': selected })}
            aria-disabled={disabled || undefined}
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              onChange(opt.value);
            }}
            className={classNameBtn}
          >
            {opt.icon ? <span className="shrink-0 [&_svg]:shrink-0">{opt.icon}</span> : null}
            <span className={cn(opt.icon && 'min-w-0 truncate')}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
