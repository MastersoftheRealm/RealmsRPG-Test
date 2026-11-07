import 'server-only';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { OAUTH_DELETE_REAUTH_REQUIRED } from '@/lib/auth/oauth-delete-messages';
import {
  OAUTH_DELETE_GRANT_COOKIE,
  OAUTH_DELETE_GRANT_MAX_AGE_S,
  OAUTH_DELETE_INTENT_MAX_AGE_S,
  sessionIdFromAccessToken,
  verifyOAuthDeleteGrant,
} from '@/lib/auth/oauth-delete-grant-core';

export {
  OAUTH_DELETE_GRANT_COOKIE,
  OAUTH_DELETE_INTENT_COOKIE,
  createOAuthDeleteIntentNonce,
  isMyAccountDeleteReauthDestination,
  mintOAuthDeleteGrant,
  mintOAuthDeleteIntent,
  sessionIdFromAccessToken,
  verifyOAuthDeleteIntent,
} from '@/lib/auth/oauth-delete-grant-core';

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

export function oauthDeleteIntentCookieOptions(): {
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
    maxAge: OAUTH_DELETE_INTENT_MAX_AGE_S,
  };
}

export async function readOAuthDeleteGrantCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(OAUTH_DELETE_GRANT_COOKIE)?.value;
}

export async function clearOAuthDeleteGrantCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(OAUTH_DELETE_GRANT_COOKIE);
}

export async function assertOAuthDeleteSessionGrant(
  expectedUid: string,
  grantToken?: string | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = grantToken ?? (await readOAuthDeleteGrantCookie());

  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.access_token) {
    return { ok: false, error: OAUTH_DELETE_REAUTH_REQUIRED };
  }

  const sessionId = sessionIdFromAccessToken(sessionData.session.access_token);
  if (!sessionId) {
    return { ok: false, error: OAUTH_DELETE_REAUTH_REQUIRED };
  }

  if (!verifyOAuthDeleteGrant(token, expectedUid, sessionId)) {
    return { ok: false, error: OAUTH_DELETE_REAUTH_REQUIRED };
  }

  return { ok: true };
}
