/**
 * Input Component
 * =================
 * Text input with label and error handling.
 * Filter panels (Codex/Library number fields next to FilterNativeSelect) use
 * `FilterInput` from `@/components/patterns/filters` — do not restyle this default h-10 chrome per page.
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-surface px-4 py-2.5 text-sm',
            'text-text-primary placeholder:text-text-muted',
            'focus:border-primary-outline-border focus:ring-2 focus:ring-primary-outline-border focus:outline-none',
            'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:opacity-50',
            error ? 'border-danger focus:ring-danger-border' : 'border-border-light',
            className,
          )}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...props}
        />
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

Input.displayName = 'Input';

export { Input };
