import { describe, expect, it } from 'vitest';
import { PERSISTENT_AUTH_SESSION_MAX_AGE_S } from '@/lib/auth/session-persistence';
import { createSupabaseAuthCookieMethods } from '@/lib/supabase/supabase-auth-cookies';

describe('browser auth cookie persistence (setAll)', () => {
  it('drops persistent maxAge when Remember me is off', async () => {
    const jar = new Map<string, { value: string; options?: { maxAge?: number } }>();
    jar.set('realms-auth-remember', { value: '0', options: {} });

    const methods = createSupabaseAuthCookieMethods({
      getAll: () => [...jar.entries()].map(([name, entry]) => ({ name, value: entry.value })),
      set: (name, value, options?) => {
        jar.set(name, options ? { value, options } : { value });
      },
    });

    await methods.setAll([
      {
        name: 'sb-demo-auth-token',
        value: 'token',
        options: { maxAge: PERSISTENT_AUTH_SESSION_MAX_AGE_S, path: '/' },
      },
    ]);

    const session = jar.get('sb-demo-auth-token');
    expect(session?.options?.maxAge).toBeUndefined();
  });

  it('keeps persistent maxAge when Remember me is on', async () => {
    const jar = new Map<string, { value: string; options?: { maxAge?: number } }>();
    jar.set('realms-auth-remember', { value: '1', options: {} });

    const methods = createSupabaseAuthCookieMethods({
      getAll: () => [...jar.entries()].map(([name, entry]) => ({ name, value: entry.value })),
      set: (name, value, options?) => {
        jar.set(name, options ? { value, options } : { value });
      },
    });

    await methods.setAll([
      {
        name: 'sb-demo-auth-token',
        value: 'token',
        options: { path: '/' },
      },
    ]);

    const session = jar.get('sb-demo-auth-token');
    expect(session?.options?.maxAge).toBe(PERSISTENT_AUTH_SESSION_MAX_AGE_S);
  });
});
