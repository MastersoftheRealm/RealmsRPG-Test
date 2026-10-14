'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { AUTH_LOGIN_RATE_LIMIT_MESSAGE, AUTH_RATE_LIMIT_MESSAGE } from '@/lib/auth-errors';
import { buildAuthCaptchaOptions } from '@/lib/auth/captcha';
import {
  authActionLimiter,
  buildAuthCredentialRateLimitKey,
  resolveClientIp,
} from '@/lib/rate-limit';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
}

async function enforceAuthCredentialRateLimit(
  prefix: string,
  email: string,
): Promise<{ allowed: true } | { allowed: false }> {
  const headerList = await headers();
  const ip = resolveClientIp(headerList);
  const normalizedEmail = email.trim().toLowerCase();
  const { success } = await authActionLimiter.check(
    buildAuthCredentialRateLimitKey(prefix, { ip, email: normalizedEmail }),
  );
  if (!success) {
    return { allowed: false };
  }
  return { allowed: true };
}

function mapSupabaseRateLimit(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('rate') || lower.includes('too many');
}

/** Rate-limited password sign-in (H4 / app-layer auth limits). */
export async function loginWithPasswordAction(
  email: string,
  password: string,
  captchaToken?: string | null,
): Promise<
  { success: true } | { success: false; error: string; rateLimited?: boolean | undefined }
> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'Valid email is required' };
  }
  if (!password) {
    return { success: false, error: 'Password is required' };
  }

  const limit = await enforceAuthCredentialRateLimit('auth-login', normalizedEmail);
  if (!limit.allowed) {
    return { success: false, error: AUTH_LOGIN_RATE_LIMIT_MESSAGE, rateLimited: true };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
    options: buildAuthCaptchaOptions(captchaToken ?? null),
  });

  if (error) {
    const msg = error.message ?? 'An error occurred during sign in. Please try again.';
    if (mapSupabaseRateLimit(msg)) {
      return { success: false, error: AUTH_LOGIN_RATE_LIMIT_MESSAGE, rateLimited: true };
    }
    return { success: false, error: msg };
  }

  return { success: true };
}

/** Rate-limited registration (H4 / app-layer auth limits). */
export async function signUpAction(
  email: string,
  password: string,
  options?: {
    redirectPath?: string | undefined;
    usernameDisplay?: string | undefined;
    captchaToken?: string | null | undefined;
  },
): Promise<
  | { success: true; needsEmailConfirmation: boolean }
  | { success: false; error: string; rateLimited?: boolean | undefined }
> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'Valid email is required' };
  }
  if (!password) {
    return { success: false, error: 'Password is required' };
  }

  const limit = await enforceAuthCredentialRateLimit('auth-signup', normalizedEmail);
  if (!limit.allowed) {
    return { success: false, error: AUTH_RATE_LIMIT_MESSAGE, rateLimited: true };
  }

  const next = sanitizeRedirectPath(options?.redirectPath || '/');
  const chosenUsername = options?.usernameDisplay?.trim();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      ...buildAuthCaptchaOptions(options?.captchaToken ?? null),
      emailRedirectTo: `${siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`,
      ...(chosenUsername ? { data: { username_display: chosenUsername } } : {}),
    },
  });

  if (error) {
    const msg = error.message ?? 'An error occurred during registration. Please try again.';
    if (mapSupabaseRateLimit(msg)) {
      return { success: false, error: AUTH_RATE_LIMIT_MESSAGE, rateLimited: true };
    }
    return { success: false, error: msg };
  }

  return { success: true, needsEmailConfirmation: !data.session };
}

/** Rate-limited password reset email request (H4 / app-layer auth limits). */
export async function requestPasswordResetAction(
  email: string,
  captchaToken?: string | null,
): Promise<
  { success: true } | { success: false; error: string; rateLimited?: boolean | undefined }
> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'Valid email is required' };
  }

  const limit = await enforceAuthCredentialRateLimit('auth-password-reset', normalizedEmail);
  if (!limit.allowed) {
    return { success: false, error: AUTH_RATE_LIMIT_MESSAGE, rateLimited: true };
  }

  const supabase = await createClient();
  const redirectTo = `${siteOrigin()}/auth/confirm?next=${encodeURIComponent('/reset-password')}`;
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo,
    ...buildAuthCaptchaOptions(captchaToken ?? null),
  });

  if (error) {
    const msg = error.message ?? 'An error occurred. Please try again.';
    if (mapSupabaseRateLimit(msg)) {
      return { success: false, error: AUTH_RATE_LIMIT_MESSAGE, rateLimited: true };
    }
    return { success: false, error: msg };
  }

  return { success: true };
}

/** Rate-limited signup confirmation resend (TASK-361). */
export async function resendConfirmationAction(
  email: string,
  redirectPath?: string,
): Promise<
  { success: true } | { success: false; error: string; rateLimited?: boolean | undefined }
> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'Valid email is required' };
  }

  const limit = await enforceAuthCredentialRateLimit('auth-resend', normalizedEmail);
  if (!limit.allowed) {
    return { success: false, error: AUTH_RATE_LIMIT_MESSAGE, rateLimited: true };
  }

  const next = sanitizeRedirectPath(redirectPath || '/');
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizedEmail,
    options: {
      emailRedirectTo: `${siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    const msg = error.message ?? 'Failed to resend confirmation email';
    if (mapSupabaseRateLimit(msg)) {
      return { success: false, error: AUTH_RATE_LIMIT_MESSAGE, rateLimited: true };
    }
    return { success: false, error: msg };
  }

  return { success: true };
}
