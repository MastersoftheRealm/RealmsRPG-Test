/**
 * CheckboxFilter Component
 * =========================
 * Filter with multiple checkbox options.
 * Matches vanilla site's feat type filter.
 */

'use client';

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
          <label
            key={option.id}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={option.checked}
              onChange={(e) => onChange(option.id, e.target.checked)}
              className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-text-secondary">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
