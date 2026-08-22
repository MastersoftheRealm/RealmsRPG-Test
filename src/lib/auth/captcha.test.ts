import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildAuthCaptchaOptions, getTurnstileSiteKey, isAuthCaptchaRequired } from './captcha';

describe('auth captcha helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns undefined when site key is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
    expect(getTurnstileSiteKey()).toBeUndefined();
    expect(isAuthCaptchaRequired()).toBe(false);
    expect(buildAuthCaptchaOptions('token')).toEqual({});
  });

  it('passes captchaToken when site key is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'test-site-key');
    expect(getTurnstileSiteKey()).toBe('test-site-key');
    expect(isAuthCaptchaRequired()).toBe(true);
    expect(buildAuthCaptchaOptions('abc')).toEqual({ captchaToken: 'abc' });
    expect(buildAuthCaptchaOptions(null)).toEqual({});
  });
});
