/**
 * Spinner Component (Unified)
 * ============================
 * Unified loading spinner with consistent styling.
 * Replaces all inline spinner implementations.
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | undefined;
  /** Color variant */
  variant?: 'primary' | 'white' | undefined;
  /** Optional label for accessibility */
  label?: string | undefined;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-12 h-12 border-4',
  xl: 'w-16 h-16 border-4',
};

const variantClasses = {
  primary: 'border-primary-subtle-border border-t-primary-button',
  white: 'border-white/30 border-t-white',
};

export function Spinner({
  size = 'md',
  variant = 'primary',
  label = 'Loading...',
  className,
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'animate-spin rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * LoadingState Component
 * =======================
 * Centered loading state for page sections.
 */
interface LoadingStateProps {
  /** Loading message */
  message?: string | undefined;
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | undefined;
  /** Vertical padding */
  padding?: 'sm' | 'md' | 'lg' | undefined;
}

const paddingClasses = {
  sm: 'py-6',
  md: 'py-12',
  lg: 'py-24',
};

export function LoadingState({ message, size = 'lg', padding = 'md' }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center', paddingClasses[padding])}>
      <Spinner size={size} />
      {message && <p className="mt-4 text-text-muted">{message}</p>}
    </div>
  );
}

Spinner.displayName = 'Spinner';
LoadingState.displayName = 'LoadingState';
