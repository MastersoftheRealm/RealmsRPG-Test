import { NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import {
  AUTH_REMEMBER_PREFERENCE_COOKIE,
  PERSISTENT_AUTH_SESSION_MAX_AGE_S,
} from '@/lib/auth/session-persistence';
import {
  applyPendingCookiesToResponse,
  createAccumulatingSupabaseCookieStore,
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

  it('applies every cookie from one setAll onto a single response', async () => {
    const { methods, pending } = createAccumulatingSupabaseCookieStore(
      () => [],
      () => {},
    );
    await methods.setAll([
      {
        name: 'sb-demo-auth-token',
        value: 'part-a',
        options: { maxAge: 123, path: '/' },
      },
      {
        name: 'sb-demo-auth-token.0',
        value: 'part-b',
        options: { maxAge: 123, path: '/' },
      },
    ]);
    expect(pending).toHaveLength(2);

    const response = new NextResponse();
    const setSpy = vi.spyOn(response.cookies, 'set');
    applyPendingCookiesToResponse(response, pending);
    expect(setSpy).toHaveBeenCalledTimes(2);
    expect(setSpy.mock.calls.map((call) => call[0])).toEqual([
      'sb-demo-auth-token',
      'sb-demo-auth-token.0',
    ]);
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
      options: expect.objectContaining({ httpOnly: false }),
    });
  });
});
