/**
 * reportError — the one call site app code should use instead of a bare `console.error`
 * ====================================================================================
 * Works in server routes, server components and client components. Always logs locally, and
 * additionally forwards to Sentry when a DSN is configured. Sentry is loaded lazily so an
 * unconfigured environment never pays for the SDK.
 *
 * Usage:
 *   reportError(error, { scope: 'POST /api/characters', extra: { characterId } });
 *
 * Pass identifiers, status codes and counts in `extra` — never request bodies, tokens,
 * emails or anything else that would put user data in a third-party service.
 */

import { isErrorReportingEnabled } from './config';

export type ReportErrorExtra = Record<string, string | number | boolean | null | undefined>;

export interface ReportErrorContext {
  /** Where the failure happened, e.g. a route path or component name. */
  scope: string;
  /** Non-sensitive breadcrumbs to attach to the issue. */
  extra?: ReportErrorExtra | undefined;
}

export function reportError(error: unknown, context: ReportErrorContext): void {
  const label = `[${context.scope}]`;
  if (context.extra) {
    console.error(label, error, context.extra);
  } else {
    console.error(label, error);
  }

  if (!isErrorReportingEnabled()) return;

  void import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.captureException(error, {
        tags: { scope: context.scope },
        ...(context.extra ? { extra: context.extra } : {}),
      });
    })
    .catch(() => {
      // A reporting failure must never replace or mask the error being reported.
    });
}
