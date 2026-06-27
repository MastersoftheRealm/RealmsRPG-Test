/**
 * SelectFilter Component
 * =======================
 * Simple dropdown filter for single selection.
 * Matches vanilla site's required level and state feats filters.
 */

'use client';

import { useId, useMemo } from 'react';
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
  className?: string;
}

export function SelectFilter({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
  className = '',
}: SelectFilterProps) {
  const id = useId();
  const uniqueOptions = useMemo(() => dedupeSelectOptions(options), [options]);
  const showPlaceholder = shouldShowSelectPlaceholder(placeholder, uniqueOptions);

  return (
    <div className={cn('filter-group', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-border-light rounded-md bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-outline-border focus:border-primary-outline-border"
      >
        {showPlaceholder && <option value="">{placeholder}</option>}
        {uniqueOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
