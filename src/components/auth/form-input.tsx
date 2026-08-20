/**
 * FormInput Component
 * ====================
 * Reusable form input with error handling
 */

'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  error?: string | undefined;
  helperText?: string | undefined;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-surface px-4 py-3 text-text-primary',
            'placeholder:text-text-muted dark:placeholder:text-text-secondary',
            'focus:border-transparent focus:ring-2 focus:ring-primary-outline-border focus:outline-none',
            'duration-base transition-colors',
            error
              ? 'border-danger-border focus:ring-danger-border'
              : 'border-border-light hover:border-border dark:border-border',
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-danger-fg">{error}</p>}
        {helperText && !error && <p className="text-sm text-text-secondary">{helperText}</p>}
      </div>
    );
  },
);

FormInput.displayName = 'FormInput';

export { FormInput };
