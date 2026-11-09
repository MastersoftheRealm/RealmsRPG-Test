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

import type { NextRequest } from 'next/server';
import { rejectCrossOriginApiMutation } from '@/lib/api-mutation-guard';
import { redirectOAuthCodeToCallback } from '@/lib/supabase/proxy-oauth-redirect';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: Request) {
  const nextRequest = request as NextRequest;
  const pathname = nextRequest.nextUrl.pathname;

  if (pathname === '/') {
    const oauthRedirect = redirectOAuthCodeToCallback(nextRequest);
    if (oauthRedirect) return oauthRedirect;
  }

  if (pathname.startsWith('/api/')) {
    const csrfDenied = rejectCrossOriginApiMutation(nextRequest);
    if (csrfDenied) return csrfDenied;
  }

  return await updateSession(nextRequest);
}

export const config = {
  matcher: [
    // Exclude: static assets, auth callbacks, images (incl. /images/ e.g. placeholder-portrait.png), high-volume APIs, bot paths.
    // /images/ is requested heavily (placeholder on every character card/sheet); exclude so proxy never runs for it.
    // api/codex and api/official stay off the matcher (free-tier edge). Codex is GET-only;
    // official mutations use handler-level validateJson / verifyMutationRequest.
    '/((?!_next/static|_next/image|images/|favicon\\.ico|manifest\\.json(?:/|$)|robots\\.txt(?:/|$)|sitemap\\.xml(?:/|$)|auth/callback|auth/confirm|api/codex(?:/|$)|api/official(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)',
  ],
};
