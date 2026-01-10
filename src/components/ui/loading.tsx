/**
 * Loading Components
 * ==================
 * Loading spinner, overlay, and skeleton loaders.
 */

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Spinner - Basic rotating spinner
 */
export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const spinnerSizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-gray-300 border-t-primary',
        spinnerSizes[size],
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}

/**
 * LoadingOverlay - Full-screen loading overlay
 */
export interface LoadingOverlayProps {
  message?: string;
  isVisible?: boolean;
}

export function LoadingOverlay({ message = 'Loading...', isVisible = true }: LoadingOverlayProps) {
  if (!isVisible) return null;
  
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      <p className="mt-4 text-white text-lg font-medium">{message}</p>
    </div>
  );
}

/**
 * Skeleton - Placeholder for loading content
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({ 
  variant = 'rectangular', 
  width, 
  height, 
  lines = 1,
  className, 
  style,
  ...props 
}: SkeletonProps) {
  const baseClass = 'bg-gray-200 animate-pulse';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  if (lines > 1 && variant === 'text') {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClass, variantClasses.text, 'h-4')}
            style={{ 
              width: i === lines - 1 ? '75%' : '100%',
              ...style 
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClass, variantClasses[variant], className)}
      style={{ 
        width: width ?? '100%', 
        height: height ?? (variant === 'text' ? '1em' : '100px'),
        ...style 
      }}
      {...props}
    />
  );
}

/**
 * SkeletonCard - Pre-built skeleton for card loading states
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl shadow-sm p-6', className)}>
      <Skeleton variant="text" height={24} width="60%" className="mb-4" />
      <Skeleton variant="text" lines={3} className="mb-4" />
      <div className="flex gap-2">
        <Skeleton width={80} height={32} />
        <Skeleton width={80} height={32} />
      </div>
    </div>
  );
}

/**
 * PageLoader - Centered page loading state
 */
export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
      <Spinner size="lg" />
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );
}
