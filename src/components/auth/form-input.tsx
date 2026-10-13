/**
 * FormInput Component
 * ====================
 * Reusable form input with error handling
 */

'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  error?: string | undefined;
  helperText?: string | undefined;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

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
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...props}
        />
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-danger-fg">
            {error}
          </p>
        ) : null}
        {helperText && !error ? (
          <p id={helperId} className="text-sm text-text-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

FormInput.displayName = 'FormInput';

export { FormInput };
