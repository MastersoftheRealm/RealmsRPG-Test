/**
 * Server-side API error responses (Route Handlers).
 * Log raw Supabase/Postgres failures server-side; return generic `{ error: string }` to clients.
 * See ARCHITECTURE_CONSTITUTION.md § API error responses.
 */

import { NextResponse } from 'next/server';

/** Log the underlying failure for server diagnostics. */
export function logApiError(context: string, err: unknown): void {
  console.error(`[API Error] ${context}:`, err);
}

/** Standard JSON error body for Route Handlers. */
export function apiErrorResponse(
  clientMessage: string,
  status: number,
  context?: string,
  err?: unknown
): NextResponse<{ error: string }> {
  if (context !== undefined || err !== undefined) {
    logApiError(context ?? clientMessage, err ?? context);
  }
  return NextResponse.json({ error: clientMessage }, { status });
}
