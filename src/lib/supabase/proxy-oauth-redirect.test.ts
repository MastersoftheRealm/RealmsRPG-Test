import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import {
  redirectOAuthCodeToCallback,
  shouldRedirectOAuthCodeFromRoot,
} from './proxy-oauth-redirect';

describe('proxy OAuth code redirect', () => {
  it('only redirects from the site root', () => {
    expect(shouldRedirectOAuthCodeFromRoot('/', 'pkce-code')).toBe(true);
    expect(shouldRedirectOAuthCodeFromRoot('/login', 'pkce-code')).toBe(false);
    expect(shouldRedirectOAuthCodeFromRoot('/characters', 'pkce-code')).toBe(false);
    expect(shouldRedirectOAuthCodeFromRoot('/', null)).toBe(false);
  });

  it('sends root ?code= to /auth/callback before session refresh', () => {
    const request = new NextRequest('https://realmsrpg.com/?code=abc&next=%2Fmy-account');
    const response = redirectOAuthCodeToCallback(request);
    expect(response?.status).toBe(307);
    const location = response?.headers.get('location') ?? '';
    expect(location).toContain('/auth/callback');
    expect(location).toContain('code=abc');
    expect(location).toContain('next=%2Fmy-account');
  });

  it('ignores ?code= on non-root routes', () => {
    const request = new NextRequest('https://realmsrpg.com/login?code=abc');
    expect(redirectOAuthCodeToCallback(request)).toBeNull();
  });
});
