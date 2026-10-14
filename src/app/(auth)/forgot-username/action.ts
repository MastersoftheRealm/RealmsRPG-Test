/**
 * Forgot Username Server Action
 * =============================
 * Email delivery is not implemented. Rate-limited stub for future lookup flow.
 */

'use server';

import { headers } from 'next/headers';
import {
  authActionLimiter,
  buildAuthCredentialRateLimitKey,
  resolveClientIp,
} from '@/lib/rate-limit';

export async function submitForgotUsernameAction(_email: string): Promise<{ supported: false }> {
  const headerList = await headers();
  const ip = resolveClientIp(headerList);
  const normalized = _email.trim().toLowerCase();
  const { success } = await authActionLimiter.check(
    buildAuthCredentialRateLimitKey('auth-forgot-username', {
      ip,
      email: normalized.includes('@') ? normalized : undefined,
    }),
  );
  if (!success) {
    throw new Error('Too many requests. Please try again later.');
  }
  return { supported: false };
}
