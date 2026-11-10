import { describe, expect, it, vi } from 'vitest';
import {
  LOGIN_REDIRECT_SESSION_KEY,
  buildGoogleOAuthCallbackUrl,
  resolvePostAuthRedirectPath,
  resendAuthSignupConfirmation,
} from './auth-page-client';

describe('auth-page-client', () => {
  it('resolves post-auth paths from returnTo, legacy redirect, then sessionStorage', () => {
    const params = new URLSearchParams('returnTo=/library');
    expect(resolvePostAuthRedirectPath(params, null)).toBe('/library');

    const legacy = new URLSearchParams('redirect=/characters');
    expect(resolvePostAuthRedirectPath(legacy, null)).toBe('/characters');

    const storage = {
      getItem: vi.fn(() => '/encounters'),
    } as unknown as Storage;
    expect(resolvePostAuthRedirectPath(new URLSearchParams(), storage)).toBe('/encounters');
    expect(storage.getItem).toHaveBeenCalledWith(LOGIN_REDIRECT_SESSION_KEY);
  });

  it('rejects unsafe redirect targets', () => {
    const params = new URLSearchParams(`returnTo=${encodeURIComponent('//evil.example')}`);
    expect(resolvePostAuthRedirectPath(params, null)).toBe('/');
  });

  it('builds Google OAuth callback URLs with a sanitized next path', () => {
    expect(buildGoogleOAuthCallbackUrl('https://realmsrpg.com', '/campaigns')).toBe(
      'https://realmsrpg.com/auth/callback?next=%2Fcampaigns',
    );
    expect(buildGoogleOAuthCallbackUrl('https://realmsrpg.com', '//evil.example')).toBe(
      'https://realmsrpg.com/auth/callback?next=%2F',
    );
  });

  it('delegates resend to the server action with a normalized email', async () => {
    const resend = vi.fn(async () => ({ success: true as const }));
    const result = await resendAuthSignupConfirmation(resend, '  User@Example.com ', '/');
    expect(result).toEqual({ success: true });
    expect(resend).toHaveBeenCalledWith('user@example.com', '/');
  });
});
