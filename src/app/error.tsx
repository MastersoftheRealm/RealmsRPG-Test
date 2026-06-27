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
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="flex flex-col items-center gap-4 max-w-md text-center w-full">
          <AlertCircle className="w-12 h-12 text-danger-fg" aria-hidden />
          <PageHeader
            title="Something went wrong"
            size="sm"
            className="mb-0 w-full [&_h1]:justify-center"
            description="An unexpected error occurred. You can try again, or return to the home page."
          />
          {process.env.NODE_ENV === 'development' && (
            <pre className="text-xs text-left bg-surface-alt p-3 rounded-lg w-full overflow-auto max-h-40 border border-border-light text-text-secondary">
              {error.message}
            </pre>
          )}
          <div className="flex items-center gap-3">
            <Button variant="primary" size="md" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Try Again
            </Button>
            <Link href="/">
              <Button variant="secondary" size="md">
                <Home className="w-4 h-4 mr-1.5" />
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
