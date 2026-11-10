/**
 * Browser Supabase cookie adapter — Remember-me via readable preference cookie + setAll overrides.
 * (@supabase/ssr 0.8 always merges persistent maxAge on refresh unless setAll adjusts options.)
 */

import { parse, serialize } from 'cookie';
import type { CookieOptions } from '@supabase/ssr';
import { createSupabaseAuthCookieMethods } from '@/lib/supabase/supabase-auth-cookies';

function readBrowserCookies(): { name: string; value: string }[] {
  if (typeof document === 'undefined') {
    return [];
  }
  const parsed = parse(document.cookie);
  return Object.entries(parsed)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([name, value]) => ({ name, value }));
}

function writeBrowserCookie(name: string, value: string, options?: CookieOptions): void {
  if (typeof document === 'undefined') {
    return;
  }
  const sameSite = options?.sameSite;
  const serializeOptions: Parameters<typeof serialize>[2] = {
    path: options?.path ?? '/',
    sameSite:
      sameSite === true || sameSite === false
        ? 'lax'
        : ((sameSite as 'lax' | 'strict' | 'none' | undefined) ?? 'lax'),
  };
  if (options?.maxAge !== undefined) {
    serializeOptions.maxAge = options.maxAge;
  }
  if (options?.expires !== undefined) {
    serializeOptions.expires = options.expires;
  }
  if (options?.secure === true) {
    serializeOptions.secure = true;
  }
  const serialized = serialize(name, value, serializeOptions);
  document.cookie = serialized;
}

export function createBrowserSupabaseCookieMethods() {
  return createSupabaseAuthCookieMethods({
    getAll: readBrowserCookies,
    set: writeBrowserCookie,
  });
}
