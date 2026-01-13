/**
 * ErrorState Component
 * ====================
 * Consistent error display for failed operations.
 */

'use client';

import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  details?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  message, 
  details = 'Please try again later',
  onRetry,
  className 
}: ErrorStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 text-center',
      className
    )}>
      <div className="w-12 h-12 mb-4 text-red-500">
        <AlertCircle className="w-full h-full" />
      </div>
      <p className="text-red-500 font-medium">{message}</p>
      {details && <p className="text-gray-500 text-sm mt-1">{details}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
