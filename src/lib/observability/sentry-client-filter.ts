import type { ErrorEvent, EventHint } from '@sentry/nextjs';

/** Patterns matched by Sentry's built-in `ignoreErrors` (message substring or regex). */
export const SENTRY_CLIENT_IGNORE_ERRORS: (string | RegExp)[] = [
  'Failed to fetch',
  'NetworkError when attempting to fetch resource',
  'Load failed',
  /^Loading chunk [\d]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
];

const CANCELLED_MESSAGE_RE = /\b(abort|cancell?ed)\b/i;

function getThrownMessage(error: unknown): string | undefined {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return undefined;
}

function getThrownName(error: unknown): string | undefined {
  if (error instanceof Error) return error.name;
  if (error && typeof error === 'object' && 'name' in error) {
    const name = (error as { name: unknown }).name;
    if (typeof name === 'string') return name;
  }
  return undefined;
}

function getHttpStatusFromError(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const record = error as Record<string, unknown>;
  if (typeof record.status === 'number') return record.status;
  if (typeof record.statusCode === 'number') return record.statusCode;
  const response = record.response;
  if (response && typeof response === 'object') {
    const status = (response as { status?: unknown }).status;
    if (typeof status === 'number') return status;
  }
  return undefined;
}

function getHttpStatusFromEvent(event: ErrorEvent): number | undefined {
  const response = event.contexts?.response;
  if (response && typeof response === 'object') {
    const statusCode = (response as { status_code?: unknown }).status_code;
    if (typeof statusCode === 'number') return statusCode;
  }
  const extra = event.extra;
  if (extra && typeof extra === 'object') {
    const status = (extra as { status?: unknown }).status;
    if (typeof status === 'number') return status;
  }
  return undefined;
}

function isReportableHttpServerError(status: number): boolean {
  return status >= 500 && status < 600;
}

export function isAbortOrCancelledRequest(error: unknown): boolean {
  const name = getThrownName(error);
  if (name === 'AbortError') return true;
  const message = getThrownMessage(error);
  return message !== undefined && CANCELLED_MESSAGE_RE.test(message);
}

export function isChunkOrDynamicImportFailure(error: unknown): boolean {
  const name = getThrownName(error);
  if (name === 'ChunkLoadError') return true;
  const message = getThrownMessage(error);
  if (!message) return false;
  return (
    /^Loading chunk [\d]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message)
  );
}

export function isHarmlessBrowserNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === 'Failed to fetch') return true;
  const message = getThrownMessage(error);
  if (!message) return false;
  if (message === 'NetworkError when attempting to fetch resource.') return true;
  if (message === 'NetworkError when attempting to fetch resource') return true;
  if (message === 'Load failed') return true;
  return false;
}

/**
 * Returns true when the event should be dropped (not sent to Sentry).
 * Server/API failures that include an HTTP 5xx status are always kept.
 */
export function shouldDropClientSentryEvent(event: ErrorEvent, hint: EventHint): boolean {
  const error = hint.originalException;
  const status = getHttpStatusFromError(error) ?? getHttpStatusFromEvent(event);
  if (status !== undefined && isReportableHttpServerError(status)) {
    return false;
  }

  if (isAbortOrCancelledRequest(error)) return true;
  if (isChunkOrDynamicImportFailure(error)) return true;
  if (isHarmlessBrowserNetworkError(error)) return true;

  return false;
}

export function sentryClientBeforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  return shouldDropClientSentryEvent(event, hint) ? null : event;
}
