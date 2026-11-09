/**
 * Shared login/register client flows — redirect resolution, Google OAuth, resend.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';

export const LOGIN_REDIRECT_SESSION_KEY = 'loginRedirect';

function readLoginRedirectSearchParam(searchParams: Pick<URLSearchParams, 'get'>): string | null {
  return searchParams.get('returnTo') ?? searchParams.get('redirect');
}

export function resolvePostAuthRedirectPath(
  searchParams: Pick<URLSearchParams, 'get'>,
  sessionStorage?: Storage | null,
): string {
  const urlRedirect = readLoginRedirectSearchParam(searchParams);
  const sessionRedirect =
    typeof sessionStorage !== 'undefined' && sessionStorage
      ? sessionStorage.getItem(LOGIN_REDIRECT_SESSION_KEY)
      : null;
  return sanitizeRedirectPath(urlRedirect || sessionRedirect || '/');
}

export function clearLoginRedirectSession(sessionStorage?: Storage | null): void {
  sessionStorage?.removeItem(LOGIN_REDIRECT_SESSION_KEY);
}

export function buildGoogleOAuthCallbackUrl(siteOrigin: string, redirectPath: string): string {
  const next = encodeURIComponent(sanitizeRedirectPath(redirectPath));
  return `${siteOrigin}/auth/callback?next=${next}`;
}

export async function signInWithGoogleOAuth(
  supabase: SupabaseClient,
  siteOrigin: string,
  redirectPath: string,
): Promise<string> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: buildGoogleOAuthCallbackUrl(siteOrigin, redirectPath),
    },
  });
  if (error) throw error;
  if (!data?.url) {
    throw new Error('Google sign-in did not return a redirect URL');
  }
  return data.url;
}

export type ResendConfirmationResult = { success: true } | { success: false; error: string };

export async function resendAuthSignupConfirmation(
  resendAction: (email: string, redirectPath: string) => Promise<ResendConfirmationResult>,
  email: string,
  redirectPath: string,
): Promise<ResendConfirmationResult> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { success: false, error: 'Valid email is required' };
  }
  return resendAction(trimmed, redirectPath);
}
