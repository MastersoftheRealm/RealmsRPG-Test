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
import { rejectCrossOriginApiMutation } from '@/lib/api-mutation-guard';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';
import { updateSession } from '@/lib/supabase/middleware';

/** High-volume public catalog GETs — CSRF still runs; session refresh is skipped for edge cost. */
function isHighVolumePublicApiRead(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') return false;
  const pathname = request.nextUrl.pathname;
  return (
    pathname === '/api/codex' ||
    pathname.startsWith('/api/codex/') ||
    pathname === '/api/official' ||
    pathname.startsWith('/api/official/')
  );
}

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

  const csrfDenied = rejectCrossOriginApiMutation(nextRequest);
  if (csrfDenied) return csrfDenied;

  if (isHighVolumePublicApiRead(nextRequest)) {
    return NextResponse.next();
  }

  return await updateSession(nextRequest);
}

export const config = {
  matcher: [
    // Exclude: static assets, auth callbacks, images (incl. /images/ e.g. placeholder-portrait.png), bot paths.
    // /images/ is requested heavily (placeholder on every character card/sheet); exclude so proxy never runs for it.
    // api/codex + api/official: proxy runs for mutations (CSRF); GET/HEAD skip session refresh in proxy().
    '/((?!_next/static|_next/image|images/|favicon\\.ico|manifest\\.json(?:/|$)|robots\\.txt(?:/|$)|sitemap\\.xml(?:/|$)|auth/callback|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)',
  ],
};
