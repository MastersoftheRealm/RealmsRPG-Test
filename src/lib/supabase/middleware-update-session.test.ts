import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUser = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser,
      signOut: vi.fn(),
    },
  })),
}));

import { updateSession } from './middleware';

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
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
  });

  it('skips getUser for signed-out visitors on public pages', async () => {
    await updateSession(envRequest('/codex'));
    expect(getUser).not.toHaveBeenCalled();
  });

  it('redirects signed-out visitors from hard-protected pages without getUser', async () => {
    const response = await updateSession(envRequest('/my-account'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/login');
    expect(getUser).not.toHaveBeenCalled();
  });

  it('calls getUser when an auth session cookie is present', async () => {
    await updateSession(
      envRequest('/codex', {
        cookies: [{ name: 'sb-example-auth-token', value: 'session' }],
      }),
    );
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it('skips getUser on link prefetch when the route is not hard-protected', async () => {
    await updateSession(
      envRequest('/library', {
        cookies: [{ name: 'sb-example-auth-token', value: 'session' }],
        headers: { 'next-router-prefetch': '1' },
      }),
    );
    expect(getUser).not.toHaveBeenCalled();
  });

  it('still refreshes session on prefetch for hard-protected routes', async () => {
    await updateSession(
      envRequest('/campaigns/abc', {
        cookies: [{ name: 'sb-example-auth-token', value: 'session' }],
        headers: { 'next-router-prefetch': '1' },
      }),
    );
    expect(getUser).toHaveBeenCalledTimes(1);
  });
});
