/**
 * Supabase Auth Callback
 * ======================
 * Handles OAuth redirect (e.g. Google sign-in).
 * Creates user profile for first-time OAuth users.
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createUserProfileAction } from '@/app/(auth)/actions';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const u = data.user;
      const email = u.email ?? '';
      const displayName = (u.user_metadata?.full_name ?? u.user_metadata?.name ?? email.split('@')[0]) as string;
      const username = displayName.toLowerCase().replace(/\s+/g, '_').substring(0, 24) || `user_${u.id.slice(0, 8)}`;
      await createUserProfileAction({
        uid: u.id,
        email,
        username,
        displayName,
      });
      const redirectTo = next.startsWith('/') ? next : `/${next}`;
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
    console.error('Auth callback error:', error);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
