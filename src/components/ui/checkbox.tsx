/**
 * Checkbox Component
 * ===================
 * A styled checkbox with label support.
 * Consistent styling across the site.
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;
    const errorId = `${checkboxId}-error`;

    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            className={cn(
              'h-4 w-4 rounded border text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0',
              'transition-colors cursor-pointer',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-danger'
                : 'border-neutral-300',
              className
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : undefined}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-2">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'text-sm font-medium cursor-pointer',
                  error ? 'text-danger' : 'text-text-primary'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-text-muted">{description}</p>
            )}
            {error && (
              <p id={errorId} className="mt-1 text-sm text-danger">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
