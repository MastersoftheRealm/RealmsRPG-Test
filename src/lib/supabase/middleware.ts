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

/**
 * Hard-protected page routes (AUTH-01): require a signed-in user. Enforced
 * server-side at the edge instead of relying solely on the client-side
 * `ProtectedRoute`. Guest-soft routes (characters, creators, library, codex, the
 * `/campaigns` list, …) are intentionally NOT listed and stay open to guests.
 */
function isHardProtectedPath(pathname: string): boolean {
  if (pathname === '/my-account' || pathname.startsWith('/my-account/')) return true;
  // Campaign detail/view routes require auth; the bare `/campaigns` list is guest-soft.
  if (pathname.startsWith('/campaigns/')) return true;
  return false;
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

  let user = null;
  try {
    // Must call getUser() to refresh token — prevents random logouts
    const { data, error } = await supabase.auth.getUser();
    user = data?.user ?? null;
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

  // AUTH-01: centralized hard gate. Unauthenticated requests to protected pages are
  // redirected to login (preserving the destination) at the edge — no protected
  // content is ever sent to the client. `ProtectedRoute` remains as defense-in-depth.
  if (!user && isHardProtectedPath(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.search = '';
    loginUrl.searchParams.set('returnTo', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
