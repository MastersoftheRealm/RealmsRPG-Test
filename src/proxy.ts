/**
 * Next.js Proxy
 * ==============
 * Runs on every request. Refreshes Supabase session via @supabase/ssr.
 * (Renamed from middleware.ts per Next.js 16 proxy convention.)
 */

import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: Request) {
  return await updateSession(request as import('next/server').NextRequest);
}

export const config = {
  matcher: [
    // Exclude auth callback/confirm — proxy can interfere with PKCE code exchange (causes auth_callback on first OAuth attempt)
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
