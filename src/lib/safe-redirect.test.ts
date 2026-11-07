import { describe, expect, it } from 'vitest';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';

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
    expect(sanitizeRedirectPath('/foo\n/bar')).toBe('/');
    expect(sanitizeRedirectPath('/foo\r/bar')).toBe('/');
    expect(sanitizeRedirectPath('/foo\u0000/bar')).toBe('/');
  });

  it('rejects auth-only paths', () => {
    expect(sanitizeRedirectPath('/login')).toBe('/');
    expect(sanitizeRedirectPath('/register')).toBe('/');
  });
});
