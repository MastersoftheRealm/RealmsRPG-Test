/**
 * ChipSelect Component
 * ====================
 * Multi-select dropdown that displays selected values as removable chips.
 * Matches vanilla site's category/ability/tag filter behavior.
 */

'use client';

import { useId, useMemo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dedupeSelectOptions } from './filter-utils';

interface ChipSelectProps {
  label: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onSelect: (value: string) => void;
  onRemove: (value: string) => void;
  className?: string;
}

export function ChipSelect({
  label,
  placeholder = 'Choose...',
  options,
  selectedValues,
  onSelect,
  onRemove,
  className = '',
}: ChipSelectProps) {
  const id = useId();
  const uniqueOptions = useMemo(() => dedupeSelectOptions(options), [options]);
  const availableOptions = uniqueOptions.filter(opt => !selectedValues.includes(opt.value));

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedValues.includes(value)) {
      onSelect(value);
      e.target.value = ''; // Reset select after selection
    }
  };

  return (
    <div className={cn('filter-group', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <select
        id={id}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-border-light rounded-md bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-outline-border focus:border-primary-outline-border"
        defaultValue=""
      >
        <option value="">{placeholder}</option>
        {availableOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedValues.map(value => {
            const option = uniqueOptions.find(o => o.value === value);
            return (
              <span
                key={value}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-subtle-bg text-primary-fg-hover rounded-full text-sm"
              >
                {option?.label || value}
                <button
                  type="button"
                  onClick={() => onRemove(value)}
                  className="hover:bg-primary-subtle-bg-hover rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${option?.label || value}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
