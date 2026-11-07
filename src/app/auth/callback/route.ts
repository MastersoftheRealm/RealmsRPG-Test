/**
 * Supabase Auth Callback
 * ======================
 * Handles OAuth redirect (e.g. Google sign-in).
 * Creates user profile for first-time OAuth users.
 * Redirect origin: {@link buildAuthRedirectUrl} (trusted hosts only).
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createUserProfileAction } from '@/app/(auth)/actions';
import { buildAuthRedirectUrl } from '@/lib/auth-redirect';
import {
  authUserHasPasswordLogin,
  userSignedInWithGoogle,
} from '@/lib/auth/sensitive-account-auth';
import {
  OAUTH_DELETE_GRANT_COOKIE,
  OAUTH_DELETE_INTENT_COOKIE,
  isMyAccountDeleteReauthDestination,
  mintOAuthDeleteGrant,
  oauthDeleteGrantCookieOptions,
  sessionIdFromAccessToken,
  verifyOAuthDeleteIntent,
} from '@/lib/auth/oauth-delete-grant.server';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = sanitizeRedirectPath(searchParams.get('next'));
  const failureRedirect = buildAuthRedirectUrl(request, '/login?error=auth_callback', {
    sanitizeUserRedirect: false,
  });

  if (!code) {
    return NextResponse.redirect(failureRedirect);
  }

  const cookieStore = await cookies();
  const intentToken = cookieStore.get(OAUTH_DELETE_INTENT_COOKIE)?.value;
  const response = NextResponse.redirect(buildAuthRedirectUrl(request, redirectTo));

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
  response.cookies.delete(OAUTH_DELETE_INTENT_COOKIE);
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

  if (
    isMyAccountDeleteReauthDestination(redirectTo) &&
    !authUserHasPasswordLogin(u) &&
    userSignedInWithGoogle(u) &&
    verifyOAuthDeleteIntent(intentToken, u.id) &&
    data.session?.access_token
  ) {
    const sessionId = sessionIdFromAccessToken(data.session.access_token);
    const grant = sessionId ? mintOAuthDeleteGrant(u.id, sessionId) : null;
    if (grant) {
      response.cookies.set(OAUTH_DELETE_GRANT_COOKIE, grant, oauthDeleteGrantCookieOptions());
    }
  }

  return response;
}
