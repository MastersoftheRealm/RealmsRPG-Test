/**
 * Next.js Proxy
 * ==============
 * Runs on every matching request (Edge). Refreshes Supabase session via @supabase/ssr.
 * (Renamed from middleware.ts per Next.js 16 proxy convention.)
 *
 * Edge usage: Each matching request = 1 Vercel Edge Request. We exclude high-volume
 * routes that don't need session refresh (public codex/public library API) to stay
 * within free tier.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * When Supabase Site URL is `/`, OAuth returns `/?code=...`. Session refresh on that
 * request can invalidate PKCE state before the code is exchanged — redirect server-side
 * before any auth refresh (see proxy matcher: auth/callback is excluded separately).
 */
function redirectOAuthCodeToCallback(request: NextRequest): NextResponse | null {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return null;

  const callbackUrl = request.nextUrl.clone();
  callbackUrl.pathname = '/auth/callback';
  callbackUrl.searchParams.set('code', code);
  callbackUrl.searchParams.set(
    'next',
    sanitizeRedirectPath(request.nextUrl.searchParams.get('next')),
  );
  return NextResponse.redirect(callbackUrl);
}

export async function proxy(request: Request) {
  const nextRequest = request as NextRequest;
  const oauthRedirect = redirectOAuthCodeToCallback(nextRequest);
  if (oauthRedirect) return oauthRedirect;

  return await updateSession(nextRequest);
}

export const config = {
  matcher: [
    // Exclude: static assets, auth callbacks, images (incl. /images/ e.g. placeholder-portrait.png), high-volume APIs, bot paths.
    // /images/ is requested heavily (placeholder on every character card/sheet); exclude so proxy never runs for it.
    '/((?!_next/static|_next/image|images/|favicon\\.ico|robots\\.txt(?:/|$)|sitemap\\.xml(?:/|$)|auth/callback|auth/confirm|api/codex(?:/|$)|api/official(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)',
  ],
};
