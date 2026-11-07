import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAuthRedirectUrl,
  collectAllowedRedirectHosts,
  resolveTrustedRedirectOrigin,
} from '@/lib/auth-redirect';

function request(
  path: string,
  headers?: Record<string, string>,
  url = 'http://localhost:3000',
): Request {
  return new Request(`${url}${path}`, headers ? { headers } : undefined);
}

describe('collectAllowedRedirectHosts', () => {
  const originalSite = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSite;
  });

  it('includes the request host and configured site URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com';
    const hosts = collectAllowedRedirectHosts(request('/auth/confirm'));
    expect(hosts.has('localhost:3000')).toBe(true);
    expect(hosts.has('realmsrpg.com')).toBe(true);
    expect(hosts.has('evil.example')).toBe(false);
  });
});

describe('resolveTrustedRedirectOrigin', () => {
  const originalSite = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSite;
    vi.unstubAllEnvs();
  });

  it('ignores a forged x-forwarded-host outside the allowlist', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com';
    vi.stubEnv('NODE_ENV', 'production');

    const origin = resolveTrustedRedirectOrigin(
      request('/auth/confirm', { 'x-forwarded-host': 'evil.example' }),
    );

    expect(origin).toBe('http://localhost:3000');
  });

  it('uses x-forwarded-host when it matches the allowlist', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com';
    vi.stubEnv('NODE_ENV', 'production');

    const origin = resolveTrustedRedirectOrigin(
      request('/auth/confirm', {
        'x-forwarded-host': 'realmsrpg.com',
        'x-forwarded-proto': 'https',
      }),
    );

    expect(origin).toBe('https://realmsrpg.com');
  });
});

describe('buildAuthRedirectUrl', () => {
  const originalSite = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSite;
    vi.unstubAllEnvs();
  });

  it('does not redirect to an external origin from a forged host', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const url = buildAuthRedirectUrl(
      request('/auth/confirm?next=%2Fmy-account', { 'x-forwarded-host': 'evil.example' }),
      '/my-account',
    );

    expect(url).toBe('http://localhost:3000/my-account');
    expect(url).not.toContain('evil.example');
  });
});
