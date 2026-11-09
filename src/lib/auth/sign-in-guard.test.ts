import { describe, expect, it } from 'vitest';
import { buildProtectedRouteLoginUrl } from './sign-in-guard';

describe('buildProtectedRouteLoginUrl', () => {
  it('preserves pathname and query in returnTo', () => {
    expect(buildProtectedRouteLoginUrl('/my-account', 'tab=security')).toBe(
      '/login?returnTo=%2Fmy-account%3Ftab%3Dsecurity',
    );
  });

  it('rejects open redirects embedded in the path', () => {
    expect(buildProtectedRouteLoginUrl('//evil.example', '')).toBe('/login');
  });
});
