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

function skipLineComment(source: string, i: number): number {
  let j = i + 2;
  while (j < source.length && source[j] !== '\n') j += 1;
  return j;
}

function skipBlockComment(source: string, i: number): number {
  let j = i + 2;
  while (j < source.length && !(source[j] === '*' && source[j + 1] === '/')) j += 1;
  return j + 2;
}

function isRegexLiteralStart(source: string, i: number): boolean {
  if (source[i] !== '/') return false;
  const next = source[i + 1];
  if (next === '/' || next === '*') return false;
  let j = i - 1;
  while (j >= 0 && /\s/.test(source[j]!)) j -= 1;
  if (j < 0) return true;
  const prev = source[j]!;
  return !/[\w$)\]'"`]/.test(prev);
}

function skipRegexLiteral(source: string, i: number): number {
  let j = i + 1;
  while (j < source.length) {
    const ch = source[j]!;
    if (ch === '\\') {
      j += 2;
      continue;
    }
    if (ch === '/') {
      j += 1;
      while (j < source.length && /[gimsuy]/i.test(source[j]!)) j += 1;
      return j;
    }
    j += 1;
  }
  return j;
}

type DelimDepths = { paren: number; brace: number; bracket: number };

function blankSlice(source: string, start: number, end: number): string {
  let s = '';
  for (let k = start; k < end; k += 1) {
    s += source[k] === '\n' ? '\n' : ' ';
  }
  return s;
}

function skipQuotedString(source: string, i: number): { out: string; end: number } {
  const quote = source[i]!;
  let out = quote;
  let j = i + 1;
  while (j < source.length) {
    const ch = source[j]!;
    if (ch === '\\') {
      out += '  ';
      j += 2;
      continue;
    }
    if (ch === quote) {
      out += quote;
      return { out, end: j + 1 };
    }
    out += ch === '\n' ? '\n' : ' ';
    j += 1;
  }
  return { out, end: j };
}

function skipTemplateLiteral(source: string, i: number): { out: string; end: number } {
  let out = '`';
  let j = i + 1;
  while (j < source.length) {
    const ch = source[j]!;
    if (ch === '\\') {
      out += '  ';
      j += 2;
      continue;
    }
    if (ch === '`') {
      out += '`';
      return { out, end: j + 1 };
    }
    if (ch === '$' && source[j + 1] === '{') {
      out += '${';
      j += 2;
      const sub = scanSubstitutedExpression(source, j);
      out += sub.out;
      out += '}';
      j = sub.end + 1;
      continue;
    }
    out += ch === '\n' ? '\n' : ' ';
    j += 1;
  }
  return { out, end: j };
}

function scanSubstitutedExpression(source: string, start: number): { out: string; end: number } {
  return scanExecutableSegment(source, start, true);
}

/**
 * Scan executable TypeScript-ish source, blanking comments, strings, regex literals,
 * and template literal text while preserving (and recursively scanning) `${...}` code.
 */
function scanExecutableSegment(
  source: string,
  start: number,
  untilSubstitutionEnd: boolean,
): { out: string; end: number } {
  let out = '';
  let i = start;
  const depths: DelimDepths = { paren: 0, brace: 0, bracket: 0 };

  while (i < source.length) {
    const ch = source[i]!;

    if (
      untilSubstitutionEnd &&
      ch === '}' &&
      depths.paren === 0 &&
      depths.brace === 0 &&
      depths.bracket === 0
    ) {
      return { out, end: i };
    }

    if (ch === '/' && source[i + 1] === '/') {
      const end = skipLineComment(source, i);
      out += blankSlice(source, i, end);
      i = end;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      const end = skipBlockComment(source, i);
      out += blankSlice(source, i, end);
      i = end;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quoted = skipQuotedString(source, i);
      out += quoted.out;
      i = quoted.end;
      continue;
    }
    if (ch === '`') {
      const templ = skipTemplateLiteral(source, i);
      out += templ.out;
      i = templ.end;
      continue;
    }
    if (ch === '/' && isRegexLiteralStart(source, i)) {
      const end = skipRegexLiteral(source, i);
      out += blankSlice(source, i, end);
      i = end;
      continue;
    }

    if (ch === '(') depths.paren += 1;
    else if (ch === ')') depths.paren -= 1;
    else if (ch === '{') depths.brace += 1;
    else if (ch === '}') depths.brace -= 1;
    else if (ch === '[') depths.bracket += 1;
    else if (ch === ']') depths.bracket -= 1;

    out += ch;
    i += 1;
  }

  return { out, end: i };
}

/**
 * Drop comments and string/template literal bodies so static scans match real call sites,
 * not mentions inside comments or string data.
 */
export function stripCommentsAndStringLiterals(source: string): string {
  return scanExecutableSegment(source, 0, false).out;
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
