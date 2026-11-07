'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { isResourceAccessUnavailableError } from '@/lib/server/resource-access-unavailable';

export default function DetailSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Detail segment]', error);
  }, [error]);

  const unavailable = isResourceAccessUnavailableError(error);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 px-4 py-16 text-center">
      <AlertCircle className="h-8 w-8 text-danger-fg" aria-hidden />
      <h1 className="text-lg font-semibold text-text-primary">
        {unavailable ? 'Temporarily unavailable' : 'Something went wrong'}
      </h1>
      <p className="text-sm text-text-muted">
        {unavailable
          ? 'We could not verify access right now. Your data is still safe — try again in a moment.'
          : 'An unexpected error occurred while loading this page.'}
      </p>
      <Button type="button" variant="secondary" size="sm" onClick={() => reset()}>
        <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden />
        Try again
      </Button>
    </div>
  );
}
