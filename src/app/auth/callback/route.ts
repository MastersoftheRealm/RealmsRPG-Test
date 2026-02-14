/**
 * Supabase Auth Callback
 * ======================
 * Handles OAuth redirect (e.g. Google sign-in).
 * Creates user profile for first-time OAuth users.
 * Uses x-forwarded-host on Vercel/proxy for correct redirect origin.
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createUserProfileAction } from '@/app/(auth)/actions';

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
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const u = data.user;
      const email = u.email ?? '';
      await createUserProfileAction({
        uid: u.id,
        email,
        username: undefined,
        displayName: undefined,
      });
      const redirectTo = next.startsWith('/') ? next : `/${next}`;
      return NextResponse.redirect(getRedirectUrl(request, redirectTo));
    }
    console.error('Auth callback error:', error);
  }

  return NextResponse.redirect(getRedirectUrl(request, '/login?error=auth_callback'));
}
