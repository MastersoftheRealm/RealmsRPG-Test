import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  OAUTH_DELETE_GRANT_MAX_AGE_S,
  isMyAccountDeleteReauthDestination,
  mintOAuthDeleteGrant,
  mintOAuthDeleteIntent,
  sessionIdFromAccessToken,
  verifyOAuthDeleteGrant,
  verifyOAuthDeleteIntent,
} from '@/lib/auth/oauth-delete-grant-core';

const TEST_KEY = 'test-service-role-key-for-oauth-delete-grant';

function accessToken(sessionId: string, sub = 'user-1'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, session_id: sessionId })).toString('base64url');
  return `${header}.${payload}.sig`;
}

beforeEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = TEST_KEY;
});

afterEach(() => {
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe('isMyAccountDeleteReauthDestination', () => {
  it('detects the deleteReauth query flag on a sanitized path', () => {
    expect(isMyAccountDeleteReauthDestination('/my-account?deleteReauth=1')).toBe(true);
    expect(isMyAccountDeleteReauthDestination('/my-account')).toBe(false);
    expect(isMyAccountDeleteReauthDestination('/characters')).toBe(false);
  });
});

describe('sessionIdFromAccessToken', () => {
  it('reads session_id from the access token payload', () => {
    expect(sessionIdFromAccessToken(accessToken('sess-a'))).toBe('sess-a');
  });
});

describe('verifyOAuthDeleteGrant', () => {
  const now = 1_700_000_000;

  it('accepts a grant bound to the same user and session', () => {
    const grant = mintOAuthDeleteGrant('user-1', 'sess-a', now)!;
    expect(verifyOAuthDeleteGrant(grant, 'user-1', 'sess-a', now)).toBe(true);
  });

  it('rejects a tampered grant signature', () => {
    const grant = mintOAuthDeleteGrant('user-1', 'sess-a', now)!;
    const tampered = `${grant}x`;
    expect(verifyOAuthDeleteGrant(tampered, 'user-1', 'sess-a', now)).toBe(false);
  });

  it('rejects a grant for the wrong user', () => {
    const grant = mintOAuthDeleteGrant('user-2', 'sess-a', now)!;
    expect(verifyOAuthDeleteGrant(grant, 'user-1', 'sess-a', now)).toBe(false);
  });

  it('rejects a grant when another session holds a fresh timestamp for the same user', () => {
    const grant = mintOAuthDeleteGrant('user-1', 'sess-b', now)!;
    expect(verifyOAuthDeleteGrant(grant, 'user-1', 'sess-a', now)).toBe(false);
  });

  it('rejects a missing grant (ordinary refresh with no OAuth delete flow)', () => {
    expect(verifyOAuthDeleteGrant(undefined, 'user-1', 'sess-a', now)).toBe(false);
  });

  it('rejects an expired grant', () => {
    const grant = mintOAuthDeleteGrant('user-1', 'sess-a', now - OAUTH_DELETE_GRANT_MAX_AGE_S - 1)!;
    expect(verifyOAuthDeleteGrant(grant, 'user-1', 'sess-a', now)).toBe(false);
  });

  it('does not mint or verify when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(mintOAuthDeleteGrant('user-1', 'sess-a', now)).toBeNull();
    expect(verifyOAuthDeleteGrant('anything', 'user-1', 'sess-a', now)).toBe(false);
  });
});

describe('verifyOAuthDeleteIntent', () => {
  const now = 1_700_000_000;

  it('accepts a signed intent for the same user with provider google', () => {
    const intent = mintOAuthDeleteIntent('user-1', 'nonce-abc', now)!;
    expect(verifyOAuthDeleteIntent(intent, 'user-1', now)).toBe(true);
  });

  it('rejects a mismatched uid', () => {
    const intent = mintOAuthDeleteIntent('user-1', 'nonce-abc', now)!;
    expect(verifyOAuthDeleteIntent(intent, 'user-2', now)).toBe(false);
  });

  it('rejects a missing intent', () => {
    expect(verifyOAuthDeleteIntent(undefined, 'user-1', now)).toBe(false);
  });
});
