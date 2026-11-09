import { describe, expect, it } from 'vitest';
import { buildLoginRedirectUrl, sanitizeRedirectPath } from '@/lib/safe-redirect';

describe('sanitizeRedirectPath', () => {
  it('allows same-origin relative paths', () => {
    expect(sanitizeRedirectPath('/my-account')).toBe('/my-account');
    expect(sanitizeRedirectPath('/characters/new?foo=1')).toBe('/characters/new?foo=1');
  });

  it('rejects protocol-relative, external, and scheme-embedded paths', () => {
    expect(sanitizeRedirectPath('//evil.example/path')).toBe('/');
    expect(sanitizeRedirectPath('https://evil.example')).toBe('/');
    expect(sanitizeRedirectPath('/\\evil.example')).toBe('/');
    expect(sanitizeRedirectPath('/javascript:alert(1)')).toBe('/');
  });

  it('rejects backslashes and control characters', () => {
    expect(sanitizeRedirectPath('/foo\\bar')).toBe('/');
    expect(sanitizeRedirectPath('/foo%5Cbar')).toBe('/');
    expect(sanitizeRedirectPath('/foo%5cbar')).toBe('/');
    expect(sanitizeRedirectPath('/foo\n/bar')).toBe('/');
    expect(sanitizeRedirectPath('/foo\r/bar')).toBe('/');
    expect(sanitizeRedirectPath('/foo\u0000/bar')).toBe('/');
  });

  it('rejects auth-only paths', () => {
    expect(sanitizeRedirectPath('/login')).toBe('/');
    expect(sanitizeRedirectPath('/register')).toBe('/');
  });
});

describe('buildLoginRedirectUrl', () => {
  it('builds bare login when destination is empty, home, or unsafe', () => {
    expect(buildLoginRedirectUrl(null)).toBe('/login');
    expect(buildLoginRedirectUrl('/')).toBe('/login');
    expect(buildLoginRedirectUrl('//evil.example')).toBe('/login');
  });

  it('encodes an allowlisted returnTo path', () => {
    expect(buildLoginRedirectUrl('/my-account')).toBe('/login?returnTo=%2Fmy-account');
    expect(buildLoginRedirectUrl('/campaigns/abc?tab=rolls')).toBe(
      '/login?returnTo=%2Fcampaigns%2Fabc%3Ftab%3Drolls',
    );
  });
});
