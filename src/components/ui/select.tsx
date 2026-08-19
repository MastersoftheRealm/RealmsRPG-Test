/**
 * Select Component
 * ==================
 * A styled select dropdown with label and error handling.
 * Consistent with the Input component styling.
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'children'
> {
  label?: string | undefined;
  error?: string | undefined;
  helperText?: string | undefined;
  options: SelectOption[];
  placeholder?: string | undefined;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, placeholder, id, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="w-full min-w-0">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <div className="relative min-w-0">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'flex h-10 w-full min-w-0 appearance-none truncate rounded-lg border bg-surface px-4 py-2.5 pr-10 text-sm',
              'text-text-primary',
              'focus:border-primary-outline-border focus:ring-2 focus:ring-primary-outline-border focus:outline-none',
              'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:opacity-50',
              error ? 'border-danger focus:ring-danger-border' : 'border-border-light',
              className,
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-danger-fg">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';

export { Select };
