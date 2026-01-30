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
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant */
  variant?: 'primary' | 'white' | 'muted';
  /** Optional label for accessibility */
  label?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-12 h-12 border-4',
  xl: 'w-16 h-16 border-4',
};

const variantClasses = {
  primary: 'border-primary-200 border-t-primary-600',
  white: 'border-white/30 border-t-white',
  muted: 'border-border-light border-t-neutral-500',
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
        'rounded-full animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * LoadingOverlay Component
 * =========================
 * Full-screen or container loading overlay with spinner.
 */
interface LoadingOverlayProps {
  /** Whether to show the overlay */
  isLoading: boolean;
  /** Loading message */
  message?: string;
  /** Whether to cover the full viewport or just the container */
  fullScreen?: boolean;
}

export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  fullScreen = false,
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50',
        fullScreen ? 'fixed inset-0' : 'absolute inset-0'
      )}
    >
      <Spinner size="lg" />
      {message && (
        <p className="mt-4 text-text-muted font-medium">{message}</p>
      )}
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
  message?: string;
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Vertical padding */
  padding?: 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  sm: 'py-6',
  md: 'py-12',
  lg: 'py-24',
};

export function LoadingState({
  message,
  size = 'lg',
  padding = 'md',
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center', paddingClasses[padding])}>
      <Spinner size={size} />
      {message && (
        <p className="mt-4 text-text-muted">{message}</p>
      )}
    </div>
  );
}

Spinner.displayName = 'Spinner';
LoadingOverlay.displayName = 'LoadingOverlay';
LoadingState.displayName = 'LoadingState';
