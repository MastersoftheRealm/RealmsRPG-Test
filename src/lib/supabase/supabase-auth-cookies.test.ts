import { describe, expect, it } from 'vitest';
import {
  AUTH_REMEMBER_PREFERENCE_COOKIE,
  PERSISTENT_AUTH_SESSION_MAX_AGE_S,
} from '@/lib/auth/session-persistence';
import {
  createSupabaseAuthCookieMethods,
  setAuthRememberSessionPreference,
} from './supabase-auth-cookies';

describe('createSupabaseAuthCookieMethods', () => {
  it('applies Remember-me persistence when writing auth-token cookies', () => {
    const jar = new Map<string, { value: string; options?: { maxAge?: number } }>();
    jar.set(AUTH_REMEMBER_PREFERENCE_COOKIE, { value: '0', options: {} });

    const methods = createSupabaseAuthCookieMethods({
      getAll: () => [...jar.entries()].map(([name, entry]) => ({ name, value: entry.value })),
      set: (name, value, options?) => {
        jar.set(name, options ? { value, options } : { value });
      },
    });

    methods.setAll([
      {
        name: 'sb-demo-auth-token',
        value: 'token',
        options: { maxAge: PERSISTENT_AUTH_SESSION_MAX_AGE_S, path: '/' },
      },
    ]);

    const written = jar.get('sb-demo-auth-token');
    expect(written?.options?.maxAge).toBeUndefined();
  });

  it('stores the Remember-me preference cookie', () => {
    const jar: { name: string; value: string; options?: { httpOnly?: boolean } }[] = [];
    setAuthRememberSessionPreference(
      {
        getAll: () => jar.map(({ name, value }) => ({ name, value })),
        set: (name, value, options?) => {
          jar.push(options ? { name, value, options } : { name, value });
        },
      },
      true,
    );
    expect(jar[0]).toMatchObject({
      name: AUTH_REMEMBER_PREFERENCE_COOKIE,
      value: '1',
      options: expect.objectContaining({ httpOnly: true }),
    });
  });
});
