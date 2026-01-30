/**
 * ChipSelect Component
 * ====================
 * Multi-select dropdown that displays selected values as removable chips.
 * Matches vanilla site's category/ability/tag filter behavior.
 */

'use client';

import { X } from 'lucide-react';

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
  const availableOptions = options.filter(opt => !selectedValues.includes(opt.value));

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedValues.includes(value)) {
      onSelect(value);
      e.target.value = ''; // Reset select after selection
    }
  };

  return (
    <div className={`filter-group ${className}`}>
      <label className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <select
        onChange={handleChange}
        className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
            const option = options.find(o => o.value === value);
            return (
              <span
                key={value}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
              >
                {option?.label || value}
                <button
                  type="button"
                  onClick={() => onRemove(value)}
                  className="hover:bg-primary-200 rounded-full p-0.5 transition-colors"
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
