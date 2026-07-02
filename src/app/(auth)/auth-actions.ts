'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { authActionLimiter, buildRateLimitKey, resolveClientIp } from '@/lib/rate-limit';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';

function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
}

/** Rate-limited signup confirmation resend (TASK-361). */
export async function resendConfirmationAction(
  email: string,
  redirectPath?: string
): Promise<{ success: true } | { success: false; error: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { success: false, error: 'Valid email is required' };
  }

  const headerList = await headers();
  const ip = resolveClientIp(headerList);
  const { success } = authActionLimiter.check(
    buildRateLimitKey('auth-resend', { ip, userId: normalizedEmail })
  );
  if (!success) {
    return { success: false, error: 'Too many requests. Please try again later.' };
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
    if (msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('too many')) {
      return { success: false, error: 'Too many requests. Please try again later.' };
    }
    return { success: false, error: msg };
  }

  return { success: true };
}
