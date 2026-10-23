import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getClaims = vi.fn();
const signOut = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getClaims,
      signOut,
    },
  })),
}));

import { updateSession } from './middleware';
import { clearVerifiedClaimsCache } from './verified-claims';

function envRequest(
  pathname: string,
  options?: { cookies?: { name: string; value: string }[]; headers?: Record<string, string> },
): NextRequest {
  const req = new NextRequest(`https://realmsrpg.com${pathname}`, {
    headers: new Headers(options?.headers ?? {}),
  });
  for (const cookie of options?.cookies ?? []) {
    req.cookies.set(cookie.name, cookie.value);
  }
  return req;
}

describe('updateSession auth refresh gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', 'publishable-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('no', { status: 500 })),
    );
    getClaims.mockResolvedValue({
      data: { claims: { sub: 'u1' }, header: {}, signature: new Uint8Array() },
      error: null,
    });
    signOut.mockResolvedValue({ error: null });
    clearVerifiedClaimsCache();
  });

  afterEach(() => {
    clearVerifiedClaimsCache();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('skips claim verification for signed-out visitors on public pages', async () => {
    await updateSession(envRequest('/codex'));
    expect(getClaims).not.toHaveBeenCalled();
  });

  it('redirects signed-out visitors from hard-protected pages without verifying a session', async () => {
    const response = await updateSession(envRequest('/my-account'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(getClaims).not.toHaveBeenCalled();
  });

  it('verifies claims when an auth session cookie is present', async () => {
    await updateSession(
      envRequest('/codex', {
        cookies: [{ name: 'sb-example-auth-token', value: 'session' }],
      }),
    );
    expect(getClaims).toHaveBeenCalledTimes(1);
  });

  it('skips claim verification on link prefetch when the route is not hard-protected', async () => {
    await updateSession(
      envRequest('/library', {
        cookies: [{ name: 'sb-example-auth-token', value: 'session' }],
        headers: { 'next-router-prefetch': '1' },
      }),
    );
    expect(getClaims).not.toHaveBeenCalled();
  });

  it('still verifies the session on prefetch for hard-protected routes', async () => {
    await updateSession(
      envRequest('/campaigns/abc', {
        cookies: [{ name: 'sb-example-auth-token', value: 'session' }],
        headers: { 'next-router-prefetch': '1' },
      }),
    );
    expect(getClaims).toHaveBeenCalledTimes(1);
  });

  it('redirects a hard-protected page when the cookie does not verify', async () => {
    getClaims.mockResolvedValue({ data: null, error: null });
    const response = await updateSession(
      envRequest('/my-account', {
        cookies: [{ name: 'sb-example-auth-token', value: 'session' }],
      }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(signOut).not.toHaveBeenCalled();
  });

  it('signs out when the refresh token is gone', async () => {
    getClaims.mockResolvedValue({
      data: null,
      error: { message: 'Refresh Token Not Found', code: 'refresh_token_not_found' },
    });
    const response = await updateSession(
      envRequest('/codex', {
        cookies: [{ name: 'sb-example-auth-token', value: 'session' }],
      }),
    );
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(response.status).not.toBe(307);
  });
});
