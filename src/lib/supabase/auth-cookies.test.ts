import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { hasSupabaseAuthSessionCookie, isNextLinkPrefetchRequest } from './auth-cookies';

function requestWithCookies(
  pathname: string,
  cookies: { name: string; value: string }[],
  headers: Record<string, string> = {},
): NextRequest {
  const url = `https://realmsrpg.com${pathname}`;
  const headerInit = new Headers(headers);
  const req = new NextRequest(url, { headers: headerInit });
  for (const { name, value } of cookies) {
    req.cookies.set(name, value);
  }
  return req;
}

describe('hasSupabaseAuthSessionCookie', () => {
  it('detects sb auth-token cookies and chunked variants', () => {
    expect(
      hasSupabaseAuthSessionCookie(
        requestWithCookies('/', [{ name: 'sb-project-auth-token', value: 'x' }]),
      ),
    ).toBe(true);
    expect(
      hasSupabaseAuthSessionCookie(
        requestWithCookies('/', [{ name: 'sb-project-auth-token.0', value: 'x' }]),
      ),
    ).toBe(true);
  });

  it('ignores unrelated cookies', () => {
    expect(
      hasSupabaseAuthSessionCookie(
        requestWithCookies('/', [
          { name: 'sb-project-auth-token-code-verifier', value: 'pkce' },
          { name: 'theme', value: 'dark' },
        ]),
      ),
    ).toBe(false);
  });
});

describe('isNextLinkPrefetchRequest', () => {
  it('recognizes Next router prefetch headers', () => {
    expect(
      isNextLinkPrefetchRequest(requestWithCookies('/codex', [], { 'next-router-prefetch': '1' })),
    ).toBe(true);
    expect(
      isNextLinkPrefetchRequest(
        requestWithCookies('/codex', [], { 'next-router-segment-prefetch': '/codex' }),
      ),
    ).toBe(true);
    expect(
      isNextLinkPrefetchRequest(requestWithCookies('/codex', [], { 'x-middleware-prefetch': '1' })),
    ).toBe(true);
  });

  it('returns false for normal navigations', () => {
    expect(isNextLinkPrefetchRequest(requestWithCookies('/characters', []))).toBe(false);
  });
});
