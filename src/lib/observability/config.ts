/**
 * Observability configuration
 * ===========================
 * Single source of truth for whether error reporting is active. No DSN is hard-coded:
 * `SENTRY_DSN` (server) / `NEXT_PUBLIC_SENTRY_DSN` (client) come from the environment, and
 * when neither is set every entry point in this folder is a no-op — local dev and CI behave
 * exactly as they did before Sentry was installed.
 *
 * Source maps and release tracking are NOT wired up: that needs `withSentryConfig` in
 * `next.config.ts` plus `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT`.
 */

/** Errors only — performance tracing is off so an unset-quota project cannot be surprised. */
export const SENTRY_TRACES_SAMPLE_RATE = 0;

export function getSentryDsn(): string | undefined {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
  const trimmed = dsn?.trim();
  return trimmed ? trimmed : undefined;
}

export function isErrorReportingEnabled(): boolean {
  return getSentryDsn() !== undefined;
}

/** Keeps preview and production issues apart without requiring a new env var on Vercel. */
export function getSentryEnvironment(): string {
  return (
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    'development'
  );
}
