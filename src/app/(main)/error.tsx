'use client';

/**
 * Main Route Group Error Boundary
 * =================================
 * Catches runtime errors in any (main) route and shows a friendly fallback
 * with a retry button. Logs error details to the console.
 */

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button, PageHeader } from '@/components/ui';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MainError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[MainRouteError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-danger-fg" aria-hidden />
        <PageHeader
          title="Something went wrong"
          size="sm"
          className="mb-0 w-full [&_h1]:justify-center"
          description="An unexpected error occurred. You can try again, or go back to the home page."
        />
        {process.env.NODE_ENV === 'development' && (
          <pre className="max-h-40 w-full overflow-auto rounded-lg border border-border-light bg-surface-alt p-3 text-left text-xs">
            {error.message}
          </pre>
        )}
        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" onClick={reset}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Try Again
          </Button>
          <Button variant="secondary" size="md" onClick={() => (window.location.href = '/')}>
            <Home className="mr-1.5 h-4 w-4" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
