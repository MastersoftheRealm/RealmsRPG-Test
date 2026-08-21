/**
 * Browser instrumentation
 * =======================
 * Runs before the app hydrates. Only initialises Sentry when NEXT_PUBLIC_SENTRY_DSN is set at
 * build time, so an unconfigured build never ships the SDK on the critical path.
 */

import { SENTRY_TRACES_SAMPLE_RATE, getSentryDsn, getSentryEnvironment } from '@/lib/observability';

const dsn = getSentryDsn();

if (dsn) {
  void import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: getSentryEnvironment(),
      tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
      sendDefaultPii: false,
    });
  });
}
