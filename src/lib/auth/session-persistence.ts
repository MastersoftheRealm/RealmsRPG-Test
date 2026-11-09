/**
 * Supabase session cookie persistence (Remember me).
 * Aligns with @supabase/ssr default maxAge when the user opts in.
 */

import type { CookieOptions } from '@supabase/ssr';
import { isSupabaseAuthSessionCookieName } from '@/lib/supabase/auth-cookies';

/** @supabase/ssr DEFAULT_COOKIE_OPTIONS.maxAge */
export const PERSISTENT_AUTH_SESSION_MAX_AGE_S = 400 * 24 * 60 * 60;

export const AUTH_REMEMBER_PREFERENCE_COOKIE = 'realms-auth-remember';

export function readRememberSessionPreference(
  cookies: ReadonlyArray<{ name: string; value: string }>,
): boolean {
  const value = cookies.find((c) => c.name === AUTH_REMEMBER_PREFERENCE_COOKIE)?.value;
  if (value === '0') return false;
  return true;
}

export function authRememberPreferenceCookieOptions(): CookieOptions {
  return {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    maxAge: PERSISTENT_AUTH_SESSION_MAX_AGE_S,
  };
}

type AuthCookieToSet = { name: string; value: string; options?: CookieOptions | undefined };

function isWritableAuthSessionCookie(cookie: AuthCookieToSet): boolean {
  if (!isSupabaseAuthSessionCookieName(cookie.name)) {
    return false;
  }
  if (!cookie.value) {
    return false;
  }
  if (cookie.options?.maxAge === 0) {
    return false;
  }
  return true;
}

export function applySessionPersistenceToAuthCookies(
  cookiesToSet: AuthCookieToSet[],
  rememberSession: boolean,
): AuthCookieToSet[] {
  return cookiesToSet.map((cookie) => {
    if (!isWritableAuthSessionCookie(cookie)) {
      return cookie;
    }
    if (!rememberSession) {
      const options = { ...(cookie.options ?? {}) };
      delete options.maxAge;
      delete options.expires;
      return { ...cookie, options };
    }
    return {
      ...cookie,
      options: {
        ...(cookie.options ?? {}),
        maxAge: PERSISTENT_AUTH_SESSION_MAX_AGE_S,
      },
    };
  });
}
