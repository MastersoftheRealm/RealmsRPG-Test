/**
 * Local JWT verification for request auth.
 *
 * `getUser()` always calls the Auth server. `getClaims()` checks the access
 * token against the project's JWKS (this project signs with ES256) and only
 * contacts Auth when the access token is near expiry and must be refreshed.
 * The public JWKS is cached in this isolate so a warm request does not wait
 * on the network.
 */

import type { JWK, JwtPayload, SupabaseClient } from '@supabase/supabase-js';

const JWKS_TTL_MS = 10 * 60 * 1000;
const JWKS_FETCH_TIMEOUT_MS = 3000;

interface CachedJwks {
  url: string;
  fetchedAt: number;
  jwks: { keys: JWK[] };
}

let cachedJwks: CachedJwks | null = null;

export function clearVerifiedClaimsCache(): void {
  cachedJwks = null;
}

export interface VerifiedClaimsError {
  message: string;
  code?: string | undefined;
}

export interface VerifiedClaimsResult {
  claims: JwtPayload | null;
  error: VerifiedClaimsError | null;
}

function isJwksBody(value: unknown): value is { keys: JWK[] } {
  if (typeof value !== 'object' || value === null || !('keys' in value)) return false;
  const keys = (value as { keys?: unknown }).keys;
  return Array.isArray(keys) && keys.length > 0;
}

async function jwksForUrl(supabaseUrl: string): Promise<{ keys: JWK[] } | undefined> {
  const now = Date.now();
  if (cachedJwks && cachedJwks.url === supabaseUrl && now - cachedJwks.fetchedAt < JWKS_TTL_MS) {
    return cachedJwks.jwks;
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/.well-known/jwks.json`, {
      signal: AbortSignal.timeout(JWKS_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return cachedJwks?.url === supabaseUrl ? cachedJwks.jwks : undefined;
    }
    const body: unknown = await response.json();
    if (!isJwksBody(body)) {
      return cachedJwks?.url === supabaseUrl ? cachedJwks.jwks : undefined;
    }
    cachedJwks = { url: supabaseUrl, fetchedAt: now, jwks: { keys: body.keys } };
    return cachedJwks.jwks;
  } catch {
    return cachedJwks?.url === supabaseUrl ? cachedJwks.jwks : undefined;
  }
}

/** Verify the cookie session. Does not call `/auth/v1/user` when the JWT can be checked locally. */
export async function getVerifiedClaims(supabase: SupabaseClient): Promise<VerifiedClaimsResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const jwks = supabaseUrl ? await jwksForUrl(supabaseUrl) : undefined;
  const { data, error } = await supabase.auth.getClaims(undefined, jwks ? { jwks } : undefined);
  if (error) {
    return {
      claims: null,
      error: { message: error.message, code: error.code },
    };
  }
  return { claims: data?.claims ?? null, error: null };
}
