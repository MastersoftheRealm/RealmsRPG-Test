/**
 * Shared Supabase SSR cookie adapter — applies Remember-me persistence on auth-token cookies.
 */

import type { CookieOptions } from '@supabase/ssr';
import {
  AUTH_REMEMBER_PREFERENCE_COOKIE,
  applySessionPersistenceToAuthCookies,
  authRememberPreferenceCookieOptions,
  readRememberSessionPreference,
} from '@/lib/auth/session-persistence';

export type SupabaseCookieStore = {
  getAll(): { name: string; value: string }[];
  set(name: string, value: string, options?: CookieOptions): void;
};

function writeSupabaseAuthCookie(
  store: SupabaseCookieStore,
  name: string,
  value: string,
  options?: CookieOptions,
): void {
  if (options === undefined) {
    store.set(name, value);
  } else {
    store.set(name, value, options);
  }
}

export function createSupabaseAuthCookieMethods(store: SupabaseCookieStore) {
  return {
    getAll() {
      return store.getAll();
    },
    setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
      const remember = readRememberSessionPreference(store.getAll());
      const adjusted = applySessionPersistenceToAuthCookies(cookiesToSet, remember);
      for (const { name, value, options } of adjusted) {
        writeSupabaseAuthCookie(store, name, value, options);
      }
    },
  };
}

export function setAuthRememberSessionPreference(
  store: SupabaseCookieStore,
  remember: boolean,
): void {
  writeSupabaseAuthCookie(
    store,
    AUTH_REMEMBER_PREFERENCE_COOKIE,
    remember ? '1' : '0',
    authRememberPreferenceCookieOptions(),
  );
}
