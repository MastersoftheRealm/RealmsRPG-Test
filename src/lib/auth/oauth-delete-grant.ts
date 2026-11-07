import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/** Sentinel for UI mapping in `lib/auth-errors.ts` (human wording pass). */
export const OAUTH_DELETE_REAUTH_REQUIRED = 'oauth_delete_reauth_required';

export const OAUTH_DELETE_GRANT_COOKIE = 'realms_oauth_delete_grant';
export const OAUTH_DELETE_GRANT_MAX_AGE_S = 5 * 60;

type GrantPayload = {
  v: 1;
  uid: string;
  sid: string;
  exp: number;
};

function grantSigningKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return key || null;
}

export function sessionIdFromAccessToken(accessToken: string): string | null {
  const segment = accessToken.split('.')[1];
  if (!segment) return null;
  try {
    const payload = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as {
      session_id?: unknown;
    };
    return typeof payload.session_id === 'string' && payload.session_id.length > 0
      ? payload.session_id
      : null;
  } catch {
    return null;
  }
}

export function redirectTargetsOAuthDeleteReauth(path: string): boolean {
  try {
    const url = new URL(path, 'https://realmsrpg.com');
    return url.searchParams.get('deleteReauth') === '1';
  } catch {
    return false;
  }
}

export function mintOAuthDeleteGrant(
  uid: string,
  sessionId: string,
  nowSec = Math.floor(Date.now() / 1000),
): string | null {
  const key = grantSigningKey();
  if (!key) return null;
  const payload: GrantPayload = {
    v: 1,
    uid,
    sid: sessionId,
    exp: nowSec + OAUTH_DELETE_GRANT_MAX_AGE_S,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', key).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyOAuthDeleteGrant(
  token: string | undefined | null,
  uid: string,
  sessionId: string,
  nowSec = Math.floor(Date.now() / 1000),
): boolean {
  const key = grantSigningKey();
  if (!key || !token) return false;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return false;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', key).update(body).digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }
  let payload: GrantPayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as GrantPayload;
  } catch {
    return false;
  }
  if (payload.v !== 1) return false;
  if (payload.uid !== uid || payload.sid !== sessionId) return false;
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) return false;
  return true;
}

export function oauthDeleteGrantCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_DELETE_GRANT_MAX_AGE_S,
  };
}

export async function assertOAuthDeleteSessionGrant(
  expectedUid: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cookieStore = await cookies();
  const grantToken = cookieStore.get(OAUTH_DELETE_GRANT_COOKIE)?.value;

  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.access_token) {
    return { ok: false, error: OAUTH_DELETE_REAUTH_REQUIRED };
  }

  const sessionId = sessionIdFromAccessToken(sessionData.session.access_token);
  if (!sessionId) {
    return { ok: false, error: OAUTH_DELETE_REAUTH_REQUIRED };
  }

  if (!verifyOAuthDeleteGrant(grantToken, expectedUid, sessionId)) {
    return { ok: false, error: OAUTH_DELETE_REAUTH_REQUIRED };
  }

  return { ok: true };
}

export async function clearOAuthDeleteGrantCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OAUTH_DELETE_GRANT_COOKIE);
}
