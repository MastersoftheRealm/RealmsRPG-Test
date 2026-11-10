import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { chunkInvokesMutationGuard } from './api-mutation-guard-route-scan';

/** Scanner implementation markers that must not ship in the production guard module. */
const ROUTE_SCAN_SYMBOLS = [
  'stripCommentsAndStringLiterals',
  'chunkInvokesMutationGuard',
  'scanExecutableSegment',
  'skipRegexLiteral',
  'MUTATION_GUARD_CALL_PATTERNS',
] as const;

const API_MUTATION_GUARD_MARKERS = [
  'verifyMutationRequest',
  'validateJson',
  'withApiMutationHandler',
  'rejectCrossOriginApiMutation',
] as const;

const API_ROOT = path.join(import.meta.dirname, '../app/api');
const MUTATION_HANDLER_HEAD = /^export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/;
const MUTATION_HANDLER_CONST = /^export\s+const\s+(POST|PUT|PATCH|DELETE)\s*=/m;
const MUTATION_HANDLER_REEXPORT = /\bas\s+(POST|PUT|PATCH|DELETE)\b/;
const HANDLER_SPLIT =
  /(?=export\s+(?:async\s+)?function\s+(?:GET|HEAD|OPTIONS|POST|PUT|PATCH|DELETE)\s*\(|export\s+const\s+(?:GET|HEAD|OPTIONS|POST|PUT|PATCH|DELETE)\s*=)/g;

function chunkDeclaresMutationHandler(chunk: string): string | null {
  const fn = chunk.match(MUTATION_HANDLER_HEAD)?.[1];
  if (fn) return fn;
  const constExport = chunk.match(MUTATION_HANDLER_CONST)?.[1];
  if (constExport) return constExport;
  if (MUTATION_HANDLER_REEXPORT.test(chunk) && /export\s*\{/.test(chunk)) {
    const re = chunk.match(/\bas\s+(POST|PUT|PATCH|DELETE)\b/)?.[1];
    if (re) return re;
  }
  return null;
}

function listRouteFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const name of entries) {
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...listRouteFiles(full));
    } else if (name === 'route.ts') {
      files.push(full);
    }
  }
  return files;
}

function relativeApiPath(file: string): string {
  return path.relative(API_ROOT, file).replace(/\\/g, '/');
}

describe('API mutation routes CSRF coverage', () => {
  it('keeps route-scan helpers out of the production guard module', () => {
    const guard = readFileSync(path.join(import.meta.dirname, 'api-mutation-guard.ts'), 'utf8');
    for (const symbol of ROUTE_SCAN_SYMBOLS) {
      expect(guard).not.toContain(symbol);
    }
  });

  it('every mutating route handler declares a mutation guard', () => {
    const unprotected: string[] = [];

    for (const file of listRouteFiles(API_ROOT)) {
      const source = readFileSync(file, 'utf8');
      const chunks = source.split(HANDLER_SPLIT).filter(Boolean);
      for (const chunk of chunks) {
        const method = chunkDeclaresMutationHandler(chunk);
        if (!method) continue;

        if (!chunkInvokesMutationGuard(chunk)) {
          unprotected.push(`${relativeApiPath(file)} (${method})`);
        }
      }
    }

    expect(unprotected).toEqual([]);
  });

  it('TESTS2-026: detects export const POST = … as a mutating handler', () => {
    const fixture = `
export const dynamic = 'force-dynamic';
export const POST = withApiMutationHandler(async function POST(request) {
  const denied = verifyMutationRequest(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true });
});
`;
    expect(chunkDeclaresMutationHandler(fixture)).toBe('POST');
    expect(API_MUTATION_GUARD_MARKERS.some((marker) => fixture.includes(marker))).toBe(true);
  });

  it('keeps api/codex and api/official off the proxy matcher', () => {
    const proxy = readFileSync(path.join(import.meta.dirname, '../proxy.ts'), 'utf8');
    expect(proxy).not.toContain('isHighVolumePublicApiRead');
    const matcher = proxy.slice(proxy.indexOf('matcher:'));
    expect(matcher).toContain('api/codex(?:/|$)');
    expect(matcher).toContain('api/official(?:/|$)');
  });
});
