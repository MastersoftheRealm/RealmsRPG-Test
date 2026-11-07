import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  OAUTH_DELETE_GRANT_MAX_AGE_S,
  OAUTH_DELETE_INTENT_MAX_AGE_S,
  accessTokenProvesOAuthSignInInWindow,
  hashPkceCodeVerifier,
  isMyAccountDeleteReauthDestination,
  mintOAuthDeleteGrant,
  mintOAuthDeleteIntent,
  sessionIdFromAccessToken,
  verifyOAuthDeleteGrant,
  verifyOAuthDeleteIntent,
  verifyOAuthDeleteIntentBinding,
} from '@/lib/auth/oauth-delete-grant-core';

const TEST_KEY = 'test-service-role-key-for-oauth-delete-grant';

function accessToken(
  sessionId: string,
  sub = 'user-1',
  amr?: { method: string; timestamp: number }[],
): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub, session_id: sessionId, amr })).toString(
    'base64url',
  );
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

describe('accessTokenProvesOAuthSignInInWindow', () => {
  const iat = 1_700_000_000;

  it('accepts an oauth amr timestamp inside the window', () => {
    const token = accessToken('sess-a', 'user-1', [{ method: 'oauth', timestamp: iat + 30 }]);
    expect(accessTokenProvesOAuthSignInInWindow(token, iat, iat + 60)).toBe(true);
  });

  it('rejects amr timestamps outside the window', () => {
    const token = accessToken('sess-a', 'user-1', [{ method: 'oauth', timestamp: iat - 1 }]);
    expect(accessTokenProvesOAuthSignInInWindow(token, iat, iat + 60)).toBe(false);
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
  const verifier = 'pkce-verifier-google-flow';

  it('accepts a signed intent bound to the pkce verifier', () => {
    const intent = mintOAuthDeleteIntent(
      'user-1',
      'nonce-abc',
      hashPkceCodeVerifier(verifier),
      now,
    )!;
    expect(verifyOAuthDeleteIntent(intent, 'user-1', verifier, now)).toBe(true);
    expect(verifyOAuthDeleteIntentBinding(intent, verifier, now)?.uid).toBe('user-1');
  });

  it('rejects a mismatched uid', () => {
    const intent = mintOAuthDeleteIntent(
      'user-1',
      'nonce-abc',
      hashPkceCodeVerifier(verifier),
      now,
    )!;
    expect(verifyOAuthDeleteIntent(intent, 'user-2', verifier, now)).toBe(false);
  });

  it('rejects a verifier that does not match the intent cvh', () => {
    const intent = mintOAuthDeleteIntent(
      'user-1',
      'nonce-abc',
      hashPkceCodeVerifier(verifier),
      now,
    )!;
    expect(verifyOAuthDeleteIntent(intent, 'user-1', 'other-verifier', now)).toBe(false);
  });

  it('rejects a tampered intent body', () => {
    const intent = mintOAuthDeleteIntent(
      'user-1',
      'nonce-abc',
      hashPkceCodeVerifier(verifier),
      now,
    )!;
    expect(verifyOAuthDeleteIntent(`${intent}x`, 'user-1', verifier, now)).toBe(false);
  });

  it('rejects an expired intent', () => {
    const mintedAt = now - OAUTH_DELETE_INTENT_MAX_AGE_S - 5;
    const intent = mintOAuthDeleteIntent(
      'user-1',
      'nonce-abc',
      hashPkceCodeVerifier(verifier),
      mintedAt,
    )!;
    expect(verifyOAuthDeleteIntent(intent, 'user-1', verifier, now)).toBe(false);
  });

  it('rejects a missing intent', () => {
    expect(verifyOAuthDeleteIntent(undefined, 'user-1', verifier, now)).toBe(false);
  });
});
