/**
 * SelectFilter Component
 * =======================
 * Simple dropdown filter for single selection.
 * Matches vanilla site's required level and state feats filters.
 */

'use client';

interface SelectFilterProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
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
  return (
    <div className={`filter-group ${className}`}>
      <label className="block text-sm font-medium text-text-secondary mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
