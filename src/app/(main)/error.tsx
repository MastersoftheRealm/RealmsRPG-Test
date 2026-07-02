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
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 max-w-md text-center w-full">
        <AlertCircle className="w-12 h-12 text-danger-fg" aria-hidden />
        <PageHeader
          title="Something went wrong"
          size="sm"
          className="mb-0 w-full [&_h1]:justify-center"
          description="An unexpected error occurred. You can try again, or go back to the home page."
        />
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-xs text-left bg-surface-alt p-3 rounded-lg w-full overflow-auto max-h-40 border border-border-light">
            {error.message}
          </pre>
        )}
        <div className="flex items-center gap-3">
          <Button variant="primary" size="md" onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Try Again
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => (window.location.href = '/')}
          >
            <Home className="w-4 h-4 mr-1.5" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
