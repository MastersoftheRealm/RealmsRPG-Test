'use client';

/**
 * Global Error Boundary
 * =====================
 * Last-resort fallback when the root layout fails.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { reportError } from '@/lib/observability';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    reportError(error, { scope: 'GlobalError', extra: { digest: error.digest } });
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>RealmsRPG — Error</title>
      </head>
      <body className="flex min-h-screen items-center justify-center bg-surface px-4 font-sans text-text-primary antialiased">
        <main id="main-content" className="max-w-md space-y-4 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-text-secondary">
            RealmsRPG hit an unexpected error. Please try again or return home.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="min-h-[44px] rounded-lg bg-primary-button px-4 py-2 font-semibold text-text-on-dark transition-colors hover:bg-primary-button-hover"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-border-light bg-surface-alt px-4 py-2 font-semibold text-text-primary transition-colors hover:bg-surface"
            >
              Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
