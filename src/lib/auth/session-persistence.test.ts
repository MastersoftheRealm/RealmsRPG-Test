import { describe, expect, it } from 'vitest';
import {
  AUTH_REMEMBER_PREFERENCE_COOKIE,
  PERSISTENT_AUTH_SESSION_MAX_AGE_S,
  applySessionPersistenceToAuthCookies,
  readRememberSessionPreference,
} from './session-persistence';

describe('session persistence', () => {
  it('treats missing preference as persistent session (Supabase default)', () => {
    expect(readRememberSessionPreference([])).toBe(true);
    expect(
      readRememberSessionPreference([{ name: AUTH_REMEMBER_PREFERENCE_COOKIE, value: '1' }]),
    ).toBe(true);
  });

  it('opts out of persistent cookies when Remember me is unchecked', () => {
    expect(
      readRememberSessionPreference([{ name: AUTH_REMEMBER_PREFERENCE_COOKIE, value: '0' }]),
    ).toBe(false);
  });

  it('strips maxAge from auth-token cookies for a browser session', () => {
    const adjusted = applySessionPersistenceToAuthCookies(
      [
        {
          name: 'sb-demo-auth-token',
          value: 'tok',
          options: { maxAge: PERSISTENT_AUTH_SESSION_MAX_AGE_S, path: '/' },
        },
      ],
      false,
    );
    expect(adjusted[0]?.options?.maxAge).toBeUndefined();
    expect(adjusted[0]?.options?.path).toBe('/');
  });

  it('keeps long-lived maxAge on auth-token cookies when opted in', () => {
    const adjusted = applySessionPersistenceToAuthCookies(
      [{ name: 'sb-demo-auth-token.0', value: 'chunk', options: { path: '/' } }],
      true,
    );
    expect(adjusted[0]?.options?.maxAge).toBe(PERSISTENT_AUTH_SESSION_MAX_AGE_S);
  });

  it('does not alter non-session cookies', () => {
    const cookie = {
      name: 'theme',
      value: 'dark',
      options: { maxAge: 60 },
    };
    expect(applySessionPersistenceToAuthCookies([cookie], false)).toEqual([cookie]);
  });
});
