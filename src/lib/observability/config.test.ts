import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSentryEnvironment } from './config';

describe('getSentryEnvironment', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers NEXT_PUBLIC_VERCEL_ENV on the client bundle', () => {
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NODE_ENV', 'production');
    expect(getSentryEnvironment()).toBe('preview');
  });

  it('falls back to NEXT_PUBLIC_SENTRY_ENVIRONMENT then VERCEL_ENV', () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_ENVIRONMENT', 'staging');
    expect(getSentryEnvironment()).toBe('staging');

    vi.unstubAllEnvs();
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(getSentryEnvironment()).toBe('preview');
  });

  it('falls back to NODE_ENV when no Vercel labels are set', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(getSentryEnvironment()).toBe('production');
  });
});
