/**
 * Central CSRF / same-origin guard for App Router API mutations.
 *
 * - `rejectCrossOriginApiMutation` — call from proxy.ts so every `/api/*` mutation
 *   is checked before route handlers run.
 * - `withApiMutationHandler` — optional wrapper for new route exports.
 *
 * Handlers that use `validateJson` already invoke `verifyMutationRequest`; the static
 * test in `api-mutation-routes.test.ts` fails if a mutating route lacks any guard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyMutationRequest, verifyRequestOrigin } from '@/lib/api-validation';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Tokens the route coverage test treats as an explicit mutation guard. */
export const API_MUTATION_GUARD_MARKERS = [
  'verifyMutationRequest',
  'validateJson',
  'withApiMutationHandler',
  'rejectCrossOriginApiMutation',
] as const;

export function isApiMutationMethod(method: string): boolean {
  return MUTATION_METHODS.has(method.toUpperCase());
}

/**
 * Reject cross-origin state-changing `/api/*` requests at the edge (proxy).
 * No-op for non-API paths and safe methods.
 */
export function rejectCrossOriginApiMutation(
  request: NextRequest,
): NextResponse<{ error: string }> | null {
  if (!request.nextUrl.pathname.startsWith('/api/')) return null;
  return verifyRequestOrigin(request);
}

type MutationHandlerOptions = { requireJsonBody?: boolean | undefined };

type AnyContext = unknown;

/**
 * Wrap a route handler so cross-origin mutations are rejected before user code runs.
 */
export function withApiMutationHandler<C extends AnyContext = AnyContext>(
  handler: (request: NextRequest, context: C) => Promise<NextResponse> | NextResponse,
  options: MutationHandlerOptions = {},
): (request: NextRequest, context: C) => Promise<NextResponse> {
  return async (request, context) => {
    const denied = verifyMutationRequest(request, options);
    if (denied) return denied;
    return handler(request, context);
  };
}
