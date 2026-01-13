/**
 * LoadingState Component
 * =====================
 * Consistent loading spinner for async content.
 */

'use client';

import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({ 
  message = 'Loading...', 
  size = 'md',
  className 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className={cn(
        'animate-spin rounded-full border-b-2 border-primary-600',
        sizeClasses[size]
      )} />
      {message && (
        <p className="text-gray-600 mt-4 text-sm">{message}</p>
      )}
    </div>
  );
}
