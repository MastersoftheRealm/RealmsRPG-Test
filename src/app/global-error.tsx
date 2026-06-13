'use client';

/**
 * Global Error Boundary
 * =====================
 * Last-resort fallback when the root layout fails.
 */

import { useEffect } from 'react';
import Link from 'next/link';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-text-primary font-sans antialiased flex items-center justify-center px-4">
        <main id="main-content" className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-text-secondary">
            RealmsRPG hit an unexpected error. Please try again or return home.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-lg border border-border-light bg-surface-alt text-text-primary font-semibold hover:bg-surface transition-colors"
            >
              Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
