import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CI_BUILD_SUPABASE_URL,
  createPublicClient,
  isPublicSupabaseConfigured,
} from './public-client';

const env = process.env;

afterEach(() => {
  process.env = { ...env };
  vi.unstubAllEnvs();
});

describe('isPublicSupabaseConfigured', () => {
  it('returns false when URL or key is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', '');
    expect(isPublicSupabaseConfigured()).toBe(false);
    expect(createPublicClient()).toBeNull();
  });

  it('returns false for CI placeholder URL and REALMS_DISABLE_PUBLIC_SUPABASE', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', CI_BUILD_SUPABASE_URL);
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', 'ci-build-not-a-real-key');
    expect(isPublicSupabaseConfigured()).toBe(false);

    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', 'real-looking-key');
    vi.stubEnv('REALMS_DISABLE_PUBLIC_SUPABASE', '1');
    expect(isPublicSupabaseConfigured()).toBe(false);
  });

  it('returns a client when URL and key are set and not disabled', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY', 'publishable-key');
    vi.stubEnv('REALMS_DISABLE_PUBLIC_SUPABASE', '');
    expect(isPublicSupabaseConfigured()).toBe(true);
    expect(createPublicClient()).not.toBeNull();
  });
});
