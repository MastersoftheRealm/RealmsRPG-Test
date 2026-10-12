import { notFound, redirect } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@/components/patterns/chrome/error-boundary';

function catchThrown(fn: () => void): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('expected a throw');
}

function navigationStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object' || !('digest' in error)) return null;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest !== 'string') return null;
  if (digest.startsWith('NEXT_HTTP_ERROR_FALLBACK;')) return Number(digest.split(';')[1]);
  if (digest.startsWith('NEXT_REDIRECT;')) return Number(digest.split(';').at(-2));
  return null;
}

describe('Page ErrorBoundary', () => {
  it('rethrows notFound instead of rendering the 200 error fallback', () => {
    const notFoundError = catchThrown(() => notFound());
    expect(navigationStatus(notFoundError)).toBe(404);

    const rethrown = catchThrown(() =>
      ErrorBoundary.getDerivedStateFromError(notFoundError as Error),
    );
    expect(navigationStatus(rethrown)).toBe(404);
    expect(rethrown).toBe(notFoundError);
  });

  it('rethrows redirect errors', () => {
    const redirectError = catchThrown(() => redirect('/login'));
    expect(navigationStatus(redirectError)).toBe(307);

    const boundary = new ErrorBoundary({ children: null, section: 'Page' });
    const rethrown = catchThrown(() =>
      boundary.componentDidCatch(redirectError as Error, { componentStack: '' }),
    );
    expect(navigationStatus(rethrown)).toBe(307);
  });

  it('captures an ordinary render error for the fallback UI', () => {
    const error = new Error('boom');
    expect(ErrorBoundary.getDerivedStateFromError(error)).toEqual({
      hasError: true,
      error,
    });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const boundary = new ErrorBoundary({ children: null, section: 'Page' });
    boundary.componentDidCatch(error, { componentStack: '' });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
