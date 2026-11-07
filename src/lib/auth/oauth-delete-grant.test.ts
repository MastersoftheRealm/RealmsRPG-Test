import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  OAUTH_DELETE_GRANT_MAX_AGE_S,
  mintOAuthDeleteGrant,
  redirectTargetsOAuthDeleteReauth,
  sessionIdFromAccessToken,
  verifyOAuthDeleteGrant,
} from '@/lib/auth/oauth-delete-grant';

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

describe('redirectTargetsOAuthDeleteReauth', () => {
  it('detects the deleteReauth query flag on a sanitized path', () => {
    expect(redirectTargetsOAuthDeleteReauth('/my-account?deleteReauth=1')).toBe(true);
    expect(redirectTargetsOAuthDeleteReauth('/my-account')).toBe(false);
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
});
