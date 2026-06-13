/**
 * Supabase Auth Confirm
 * =====================
 * Handles email magic links and OTP verification.
 * Supabase redirects here with token_hash and type.
 */

import type { EmailOtpType, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createUserProfileAction } from '@/app/(auth)/actions';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';

function getUsernameFromUser(user: User): string | undefined {
  const meta = user.user_metadata ?? {};
  const display = meta.username_display ?? meta.username;
  if (typeof display === 'string' && display.trim()) return display.trim();
  return undefined;
}

function getRedirectUrl(request: Request, path: string): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const { origin } = new URL(request.url);

  if (isLocalEnv || !forwardedHost) {
    return `${origin}${path}`;
  }
  return `https://${forwardedHost}${path}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const redirectTo = sanitizeRedirectPath(searchParams.get('next'));

  if (token_hash && type) {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && data.user) {
      const u = data.user;
      const email = u.email ?? '';
      await createUserProfileAction({
        uid: u.id,
        email,
        username: getUsernameFromUser(u),
        displayName: undefined,
      });
      return NextResponse.redirect(getRedirectUrl(request, redirectTo));
    }
    console.error('Auth confirm error:', error);
  }

  return NextResponse.redirect(getRedirectUrl(request, `/login?error=confirm`));
}
