import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  readSupabasePkceCodeVerifier,
  supabasePkceCodeVerifierCookieKey,
} from '@/lib/auth/supabase-pkce-cookies';

function encodeSupabaseSsrCookieValue(value: string): string {
  return `base64-${Buffer.from(value, 'utf8').toString('base64url')}`;
}

const SUPABASE_URL = 'https://test.supabase.co';
const EXPECTED_KEY = 'sb-test-auth-token-code-verifier';
const VERIFIER = 'server-pkce-verifier-value';

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
});

describe('supabasePkceCodeVerifierCookieKey', () => {
  it('derives the storage key from the project ref', () => {
    expect(supabasePkceCodeVerifierCookieKey(SUPABASE_URL)).toBe(EXPECTED_KEY);
  });
});

describe('readSupabasePkceCodeVerifier', () => {
  it('decodes a base64url-encoded verifier for the configured project', () => {
    const cookies = [{ name: EXPECTED_KEY, value: encodeSupabaseSsrCookieValue(VERIFIER) }];
    expect(readSupabasePkceCodeVerifier(cookies)).toBe(VERIFIER);
  });

  it('ignores a decoy verifier cookie listed first when only the configured project cookie has data', () => {
    const cookies = [
      { name: 'sb-evil-auth-token-code-verifier', value: '' },
      { name: EXPECTED_KEY, value: encodeSupabaseSsrCookieValue(VERIFIER) },
    ];
    expect(readSupabasePkceCodeVerifier(cookies)).toBe(VERIFIER);
  });

  it('fails closed when only a non-matching project verifier is present', () => {
    const cookies = [
      { name: 'sb-evil-auth-token-code-verifier', value: encodeSupabaseSsrCookieValue('decoy') },
    ];
    expect(readSupabasePkceCodeVerifier(cookies)).toBeNull();
  });

  it('fails closed when multiple project verifiers are populated', () => {
    const cookies = [
      { name: 'sb-evil-auth-token-code-verifier', value: encodeSupabaseSsrCookieValue('decoy') },
      { name: EXPECTED_KEY, value: encodeSupabaseSsrCookieValue(VERIFIER) },
    ];
    expect(readSupabasePkceCodeVerifier(cookies)).toBeNull();
  });

  it('combines chunked verifier cookies in order', () => {
    const encoded = encodeSupabaseSsrCookieValue(VERIFIER);
    const part0 = encoded.slice(0, 8);
    const part1 = encoded.slice(8);
    const cookies = [
      { name: `${EXPECTED_KEY}.1`, value: part1 },
      { name: `${EXPECTED_KEY}.0`, value: part0 },
    ];
    expect(readSupabasePkceCodeVerifier(cookies)).toBe(VERIFIER);
  });
});
