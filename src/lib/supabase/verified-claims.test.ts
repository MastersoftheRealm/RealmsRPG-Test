import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearVerifiedClaimsCache, getVerifiedClaims } from './verified-claims';

const SUPABASE_URL = 'https://example.supabase.co';
const JWKS = {
  keys: [
    {
      alg: 'ES256',
      crv: 'P-256',
      kid: 'key-1',
      kty: 'EC',
      key_ops: ['verify'],
      use: 'sig',
      x: 'x',
      y: 'y',
    },
  ],
};

function clientWithClaims(getClaims: ReturnType<typeof vi.fn>): SupabaseClient {
  return { auth: { getClaims } } as unknown as SupabaseClient;
}

describe('getVerifiedClaims', () => {
  afterEach(() => {
    clearVerifiedClaimsCache();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('verifies with a cached JWKS and does not refetch on the next call', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL);
    const fetchMock = vi.fn(async () => Response.json(JWKS));
    vi.stubGlobal('fetch', fetchMock);
    const getClaims = vi.fn(async (_jwt?: string, options?: { jwks?: typeof JWKS }) => ({
      data: {
        claims: { sub: 'user-1', email: 'a@example.com' },
        header: {},
        signature: new Uint8Array(),
      },
      error: null,
      options,
    }));

    const first = await getVerifiedClaims(clientWithClaims(getClaims));
    const second = await getVerifiedClaims(clientWithClaims(getClaims));

    expect(first.claims?.sub).toBe('user-1');
    expect(second.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getClaims).toHaveBeenCalledTimes(2);
    expect(getClaims).toHaveBeenNthCalledWith(1, undefined, { jwks: JWKS });
    expect(getClaims).toHaveBeenNthCalledWith(2, undefined, { jwks: JWKS });
  });

  it('returns the auth error code when verification fails', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('no', { status: 500 })),
    );
    const getClaims = vi.fn(async () => ({
      data: null,
      error: {
        message: 'Invalid Refresh Token: Refresh Token Not Found',
        code: 'refresh_token_not_found',
      },
    }));

    const result = await getVerifiedClaims(clientWithClaims(getClaims));

    expect(result.claims).toBeNull();
    expect(result.error).toEqual({
      message: 'Invalid Refresh Token: Refresh Token Not Found',
      code: 'refresh_token_not_found',
    });
    expect(getClaims).toHaveBeenCalledWith(undefined, undefined);
  });
});
