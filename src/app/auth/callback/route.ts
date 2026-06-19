/**
 * Supabase Auth Callback
 * ======================
 * Handles OAuth redirect (e.g. Google sign-in).
 * Creates user profile for first-time OAuth users.
 * Uses x-forwarded-host on Vercel/proxy for correct redirect origin.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createUserProfileAction } from '@/app/(auth)/actions';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

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
  const redirectTo = sanitizeRedirectPath(searchParams.get('next'));
  const failureRedirect = getRedirectUrl(request, '/login?error=auth_callback');

  if (!code) {
    return NextResponse.redirect(failureRedirect);
  }

  const cookieStore = await cookies();
  const response = NextResponse.redirect(getRedirectUrl(request, redirectTo));

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(failureRedirect);
  }

  const u = data.user;
  const email = u.email ?? '';
  await createUserProfileAction({
    uid: u.id,
    email,
    username: undefined,
    displayName: undefined,
  });

  return response;
}
