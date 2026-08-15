/**
 * ChipSelect Component
 * ====================
 * Multi-select dropdown that displays selected values as removable chips.
 * Matches vanilla site's category/ability/tag filter behavior.
 */

'use client';

import { useId, useMemo, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterNativeSelect } from './filter-native-select';
import { dedupeSelectOptions, FILTER_LABEL_ROW_CLASS } from './filter-utils';

export interface ChipSelectOption {
  value: string;
  label: string;
  /** Optional `<optgroup>` label — set on every option to group a long list (e.g. path types). */
  group?: string;
}

interface ChipSelectProps {
  label: string;
  placeholder?: string;
  options: ChipSelectOption[];
  selectedValues: string[];
  onSelect: (value: string) => void;
  /** Required when selectedValues is non-empty (chip remove buttons). Omit for pick-only. */
  onRemove?: (value: string) => void;
  /** Optional control beside the label (e.g. InfoTippy). */
  labelAccessory?: ReactNode;
  className?: string;
}

export function ChipSelect({
  label,
  placeholder = 'Choose...',
  options,
  selectedValues,
  onSelect,
  onRemove,
  labelAccessory,
  className = '',
}: ChipSelectProps) {
  const id = useId();
  const uniqueOptions = useMemo(() => dedupeSelectOptions(options), [options]);
  const { ungroupedOptions, groupedOptions } = useMemo(() => {
    const available = uniqueOptions.filter((opt) => !selectedValues.includes(opt.value));
    const groups = new Map<string, ChipSelectOption[]>();
    const ungrouped: ChipSelectOption[] = [];
    for (const option of available) {
      if (!option.group) {
        ungrouped.push(option);
        continue;
      }
      const bucket = groups.get(option.group);
      if (bucket) bucket.push(option);
      else groups.set(option.group, [option]);
    }
    return {
      ungroupedOptions: ungrouped,
      groupedOptions: Array.from(groups, ([groupLabel, groupOptions]) => ({ groupLabel, groupOptions })),
    };
  }, [uniqueOptions, selectedValues]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedValues.includes(value)) {
      onSelect(value);
      e.target.value = ''; // Reset select after selection
    }
  };

  return (
    <div className={cn('filter-group', className)}>
      <div className={FILTER_LABEL_ROW_CLASS}>
        <label htmlFor={id} className="text-sm font-medium leading-5 text-text-secondary">
          {label}
        </label>
        {labelAccessory}
      </div>
      <FilterNativeSelect id={id} onChange={handleChange} defaultValue="">
        <option value="">{placeholder}</option>
        {ungroupedOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {groupedOptions.map(({ groupLabel, groupOptions }) => (
          <optgroup key={groupLabel} label={groupLabel}>
            {groupOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </optgroup>
        ))}
      </FilterNativeSelect>
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
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(value)}
                    className="hover:bg-primary-subtle-bg-hover rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${option?.label || value}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
