'use client';

/**
 * List error display (Codex / Library / Official lists).
 * SearchInput, EmptyState, and LoadingState live in `@/components/ui` (TASK-821).
 */

import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ErrorDisplayProps {
  message: string;
  subMessage?: string | undefined;
  /** When provided, shows a retry button that calls this handler. */
  onRetry?: (() => void) | undefined;
  /** Label for the retry button (default: "Try again"). */
  retryLabel?: string | undefined;
}

export function ErrorDisplay({
  message,
  subMessage,
  onRetry,
  retryLabel = 'Try again',
}: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 h-12 w-12 text-danger-fg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <p className="font-medium text-danger-fg">{message}</p>
      {subMessage && <p className="mt-1 text-sm text-text-muted">{subMessage}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
          <RotateCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
