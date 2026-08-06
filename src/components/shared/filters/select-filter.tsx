/**
 * SelectFilter Component
 * =======================
 * Simple dropdown filter for single selection.
 * Matches vanilla site's required level and state feats filters.
 */

'use client';

import { useId, useMemo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { dedupeSelectOptions, shouldShowSelectPlaceholder } from './filter-utils';

interface SelectFilterProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  /**
   * Optional top option with `value=""` to represent an "unfiltered" state.
   * Pass `null` to omit the placeholder option entirely.
   */
  placeholder?: string | null;
  /** Optional control beside the label (e.g. InfoTippy). */
  labelAccessory?: ReactNode;
  /** Disable the select (e.g. value set by character filter). */
  disabled?: boolean;
  /** Shown beside the label when `disabled` (e.g. Set by character). */
  disabledHint?: string;
  className?: string;
}

export function SelectFilter({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
  labelAccessory,
  disabled = false,
  disabledHint,
  className = '',
}: SelectFilterProps) {
  const id = useId();
  const uniqueOptions = useMemo(() => dedupeSelectOptions(options), [options]);
  const showPlaceholder = shouldShowSelectPlaceholder(placeholder, uniqueOptions);

  return (
    <div className={cn('filter-group', disabled && 'opacity-60', className)}>
      <div className="mb-1 flex h-5 items-center gap-1.5">
        <label htmlFor={id} className="text-sm font-medium leading-5 text-text-secondary">
          {label}
        </label>
        {disabled && disabledHint ? (
          <span className="text-xs text-text-muted dark:text-text-secondary">{disabledHint}</span>
        ) : null}
        {labelAccessory}
      </div>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-border-light bg-surface px-3 text-sm focus:border-primary-outline-border focus:outline-none focus:ring-2 focus:ring-primary-outline-border disabled:cursor-not-allowed"
      >
        {showPlaceholder && <option value="">{placeholder}</option>}
        {uniqueOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
