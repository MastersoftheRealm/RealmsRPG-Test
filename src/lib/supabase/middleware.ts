/**
 * Supabase Session Refresh
 * =========================
 * Refreshes auth session for Server Components.
 * Call from proxy.ts (Next.js 16) — required for Supabase Auth SSR.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function isOAuthCallbackInProgress(request: NextRequest): boolean {
  return request.nextUrl.searchParams.has('code');
}

/** Anonymous/static requests have no session — not an operational error. */
function isExpectedAnonymousAuthError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('auth session missing') || lower.includes('session missing');
}

export async function updateSession(request: NextRequest) {
  // Never refresh session during OAuth PKCE exchange — stale refresh attempts can
  // clear PKCE cookies and cause flow_state_not_found on /auth/callback.
  if (isOAuthCallbackInProgress(request)) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  // Skip Supabase auth when env vars are missing — allows Codex and other public APIs to work
  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY. Auth will not work. Check .env.local.'
    );
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    // Must call getUser() to refresh token — prevents random logouts
    const { error } = await supabase.auth.getUser();
    if (error?.code === 'refresh_token_not_found') {
      // Clear stale session cookies so we stop retrying invalid refresh tokens.
      await supabase.auth.signOut();
    } else if (error && !isExpectedAnonymousAuthError(error.message)) {
      console.error('[Supabase] Auth refresh failed:', error.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!isExpectedAnonymousAuthError(message)) {
      console.error('[Supabase] Auth refresh failed:', err);
    }
    // Pass through — don't block the request; auth-required routes will handle 401
  }

  return supabaseResponse;
}
