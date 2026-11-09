/**
 * Central CSRF / same-origin guard for App Router API mutations.
 *
 * - `rejectCrossOriginApiMutation` — call from proxy.ts for `/api` paths the matcher
 *   still runs. `/api/codex` and `/api/official` stay excluded (edge budget). Codex is
 *   GET-only; official mutations use handler-level `validateJson` / `verifyMutationRequest`.
 * - `withApiMutationHandler` — optional wrapper for new route exports.
 *
 * Handlers that use `validateJson` already invoke `verifyMutationRequest`; the static
 * test in `api-mutation-routes.test.ts` fails if a mutating handler lacks a live guard call.
 * Route scanning helpers live in `api-mutation-guard-route-scan.ts` (tests only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestOrigin } from '@/lib/api-validation';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

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
