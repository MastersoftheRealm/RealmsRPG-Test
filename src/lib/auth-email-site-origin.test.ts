import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveAuthEmailSiteOrigin } from './auth-email-site-origin';

describe('resolveAuthEmailSiteOrigin', () => {
  const originalSite = process.env.NEXT_PUBLIC_SITE_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalSite === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSite;
    vi.stubEnv('NODE_ENV', originalNodeEnv ?? 'test');
    vi.restoreAllMocks();
  });

  it('prefers NEXT_PUBLIC_SITE_URL without a trailing slash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://realmsrpg.com/';
    expect(resolveAuthEmailSiteOrigin(new Headers())).toBe('https://realmsrpg.com');
  });

  it('falls back to localhost in non-production when env is unset', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.stubEnv('NODE_ENV', 'development');
    expect(resolveAuthEmailSiteOrigin(new Headers())).toBe('http://localhost:3000');
  });

  it('derives origin from forwarded headers in production when env is unset', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.stubEnv('NODE_ENV', 'production');
    const headers = new Headers({
      'x-forwarded-host': 'realmsrpg.com',
      'x-forwarded-proto': 'https',
    });
    expect(resolveAuthEmailSiteOrigin(headers)).toBe('https://realmsrpg.com');
  });

  it('fails closed in production when env and host are missing', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    vi.stubEnv('NODE_ENV', 'production');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(resolveAuthEmailSiteOrigin(new Headers())).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });
});
