'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  AUTH_LOGIN_RATE_LIMIT_MESSAGE,
  AUTH_RATE_LIMIT_MESSAGE,
  getAuthErrorMessage,
} from '@/lib/auth-errors';
import { resolveAuthEmailSiteOrigin } from '@/lib/auth-email-site-origin';
import { buildAuthCaptchaOptions } from '@/lib/auth/captcha';
import {
  authActionLimiter,
  buildAuthCredentialRateLimitKey,
  resolveClientIp,
} from '@/lib/rate-limit';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';

async function authEmailSiteOrigin(): Promise<
  { ok: true; origin: string } | { ok: false; error: string }
> {
  const headerList = await headers();
  const origin = resolveAuthEmailSiteOrigin(headerList);
  if (!origin) {
    return {
      ok: false,
      error: 'Email actions are temporarily unavailable. Please try again later.',
    };
  }
  return { ok: true, origin };
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
    if (mapSupabaseRateLimit(error.message ?? '')) {
      return { success: false, error: AUTH_LOGIN_RATE_LIMIT_MESSAGE, rateLimited: true };
    }
    return { success: false, error: getAuthErrorMessage(error, 'login') };
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

  const site = await authEmailSiteOrigin();
  if (!site.ok) {
    return { success: false, error: site.error };
  }

  const next = sanitizeRedirectPath(options?.redirectPath || '/');
  const chosenUsername = options?.usernameDisplay?.trim();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      ...buildAuthCaptchaOptions(options?.captchaToken ?? null),
      emailRedirectTo: `${site.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      ...(chosenUsername ? { data: { username_display: chosenUsername } } : {}),
    },
  });

  if (error) {
    if (mapSupabaseRateLimit(error.message ?? '')) {
      return { success: false, error: AUTH_RATE_LIMIT_MESSAGE, rateLimited: true };
    }
    return { success: false, error: getAuthErrorMessage(error, 'register') };
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

  const site = await authEmailSiteOrigin();
  if (!site.ok) {
    return { success: false, error: site.error };
  }

  const supabase = await createClient();
  const redirectTo = `${site.origin}/auth/confirm?next=${encodeURIComponent('/reset-password')}`;
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo,
    ...buildAuthCaptchaOptions(captchaToken ?? null),
  });

  if (error) {
    if (mapSupabaseRateLimit(error.message ?? '')) {
      return { success: false, error: AUTH_RATE_LIMIT_MESSAGE, rateLimited: true };
    }
    return { success: false, error: getAuthErrorMessage(error, 'forgot-password') };
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

  const site = await authEmailSiteOrigin();
  if (!site.ok) {
    return { success: false, error: site.error };
  }

  const next = sanitizeRedirectPath(redirectPath || '/');
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizedEmail,
    options: {
      emailRedirectTo: `${site.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    if (mapSupabaseRateLimit(error.message ?? '')) {
      return { success: false, error: AUTH_RATE_LIMIT_MESSAGE, rateLimited: true };
    }
    return { success: false, error: getAuthErrorMessage(error, 'resend') };
  }

  return { success: true };
}
