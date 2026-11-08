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
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyRequestOrigin } from '@/lib/api-validation';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Tokens the route coverage test treats as an explicit mutation guard. */
const API_MUTATION_GUARD_MARKERS = [
  'verifyMutationRequest',
  'validateJson',
  'withApiMutationHandler',
  'rejectCrossOriginApiMutation',
] as const;

const MUTATION_GUARD_CALL_PATTERNS = API_MUTATION_GUARD_MARKERS.map(
  (name) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(`),
);

/**
 * Drop comments and string/template literal bodies so static scans match real call sites,
 * not mentions inside comments or string data.
 */
export function stripCommentsAndStringLiterals(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const c = source[i] ?? '';
    const next = source[i + 1] ?? '';
    if (c === '/' && next === '/') {
      i += 2;
      while (i < source.length && source[i] !== '\n') {
        out += ' ';
        i += 1;
      }
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        out += ' ';
        i += 1;
      }
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      out += quote;
      i += 1;
      while (i < source.length) {
        const ch = source[i] ?? '';
        if (ch === '\\') {
          out += '  ';
          i += 2;
          continue;
        }
        if (ch === quote) {
          out += quote;
          i += 1;
          break;
        }
        if (quote === '`' && ch === '$' && source[i + 1] === '{') {
          out += '${';
          i += 2;
          let depth = 1;
          while (i < source.length && depth > 0) {
            const exprCh = source[i] ?? '';
            if (exprCh === '{') depth += 1;
            else if (exprCh === '}') depth -= 1;
            out += exprCh === '\n' ? '\n' : exprCh;
            i += 1;
          }
          continue;
        }
        out += ch === '\n' ? '\n' : ' ';
        i += 1;
      }
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

/** True when the handler chunk contains a live call to a known mutation guard. */
export function chunkInvokesMutationGuard(chunk: string): boolean {
  const code = stripCommentsAndStringLiterals(chunk);
  return MUTATION_GUARD_CALL_PATTERNS.some((pattern) => pattern.test(code));
}

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
