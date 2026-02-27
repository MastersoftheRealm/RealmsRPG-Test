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

import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: Request) {
  return await updateSession(request as import('next/server').NextRequest);
}

export const config = {
  matcher: [
    // Exclude: static assets, auth callbacks, images (incl. /images/ e.g. placeholder-portrait.png), high-volume APIs, bot paths.
    // /images/ is requested heavily (placeholder on every character card/sheet); exclude so proxy never runs for it.
    '/((?!_next/static|_next/image|images/|favicon\\.ico|robots\\.txt(?:/|$)|sitemap\\.xml(?:/|$)|auth/callback|auth/confirm|api/codex(?:/|$)|api/public(?:/|$)|api/official(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)$).*)',
  ],
};
