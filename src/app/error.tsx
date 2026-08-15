'use client';

/**
 * Root Error Boundary
 * ===================
 * Catches runtime errors outside route-group boundaries.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button, PageHeader } from '@/components/ui';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[RootError]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-danger-fg" aria-hidden />
          <PageHeader
            title="Something went wrong"
            size="sm"
            className="mb-0 w-full [&_h1]:justify-center"
            description="An unexpected error occurred. You can try again, or return to the home page."
          />
          {process.env.NODE_ENV === 'development' && (
            <pre className="max-h-40 w-full overflow-auto rounded-lg border border-border-light bg-surface-alt p-3 text-left text-xs text-text-secondary">
              {error.message}
            </pre>
          )}
          <div className="flex items-center gap-3">
            <Button variant="primary" size="md" onClick={reset}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Try Again
            </Button>
            <Link href="/">
              <Button variant="secondary" size="md">
                <Home className="mr-1.5 h-4 w-4" />
                Home
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
