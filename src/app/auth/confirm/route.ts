/**
 * Supabase Auth Confirm
 * =====================
 * Email confirmation and password recovery land here.
 * PKCE links (the default for @supabase/ssr) arrive with ?code=.
 * Token-hash links arrive with ?token_hash=&type=.
 */

import type { EmailOtpType, User } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

async function createProfileFromConfirmedUser(user: User): Promise<void> {
  const result = await createUserProfileAction({
    uid: user.id,
    email: user.email ?? '',
    username: getUsernameFromUser(user),
    displayName: undefined,
  });
  if (!result.success) {
    console.error('Auth confirm profile error:', result.error);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const redirectTo = sanitizeRedirectPath(searchParams.get('next'));
  const failureRedirect = NextResponse.redirect(getRedirectUrl(request, '/login?error=confirm'));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Auth confirm error: Supabase env is not configured');
    return failureRedirect;
  }

  if (!code && !(tokenHash && type)) {
    return failureRedirect;
  }

  const cookieStore = await cookies();
  const successRedirect = NextResponse.redirect(getRedirectUrl(request, redirectTo));
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          successRedirect.cookies.set(name, value, options);
        });
      },
    },
  });

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      console.error('Auth confirm error:', error);
      return failureRedirect;
    }
    await createProfileFromConfirmedUser(data.user);
    return successRedirect;
  }

  const { data, error } = await supabase.auth.verifyOtp({
    type: type as EmailOtpType,
    token_hash: tokenHash as string,
  });
  if (error || !data.user) {
    console.error('Auth confirm error:', error);
    return failureRedirect;
  }
  await createProfileFromConfirmedUser(data.user);
  return successRedirect;
}
