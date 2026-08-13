/**
 * Server + edge instrumentation
 * =============================
 * Next.js calls `register()` once per runtime before app code loads, and `onRequestError`
 * for every uncaught error in a route handler, server component or middleware — the 500s
 * that previously only reached a `console.error` nobody tails.
 *
 * Both are inert without `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` (see lib/observability).
 */

import type { captureRequestError } from '@sentry/nextjs';
import { SENTRY_TRACES_SAMPLE_RATE, getSentryDsn, getSentryEnvironment } from '@/lib/observability';

export async function register(): Promise<void> {
  const dsn = getSentryDsn();
  if (!dsn) return;

  const Sentry = await import('@sentry/nextjs');
  Sentry.init({
    dsn,
    environment: getSentryEnvironment(),
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    sendDefaultPii: false,
  });
}

export async function onRequestError(
  ...args: Parameters<typeof captureRequestError>
): Promise<void> {
  if (!getSentryDsn()) return;

  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(...args);
}
