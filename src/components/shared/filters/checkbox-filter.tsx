/**
 * CheckboxFilter Component
 * =========================
 * Filter with multiple checkbox options.
 * Matches vanilla site's feat type filter.
 */

'use client';

import { Checkbox } from '@/components/ui';

interface CheckboxOption {
  id: string;
  label: string;
  checked: boolean;
}

interface CheckboxFilterProps {
  label: string;
  options: CheckboxOption[];
  onChange: (id: string, checked: boolean) => void;
  className?: string;
}

export function CheckboxFilter({
  label,
  options,
  onChange,
  className = '',
}: CheckboxFilterProps) {
  return (
    <div className={`filter-group ${className}`}>
      <label className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <div className="flex flex-wrap gap-4">
        {options.map(option => (
          <Checkbox
            key={option.id}
            label={option.label}
            checked={option.checked}
            onChange={(e) => onChange(option.id, e.target.checked)}
          />
        ))}
      </div>
    </div>
  );
}
