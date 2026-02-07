/**
 * Next.js Middleware
 * ==================
 * Runs on every request. Refreshes Supabase session via @supabase/ssr.
 */

import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: Request) {
  return await updateSession(request as import('next/server').NextRequest);
}

export const config = {
  matcher: [
    // Exclude auth callback/confirm — middleware can interfere with PKCE code exchange (causes auth_callback on first OAuth attempt)
    '/((?!_next/static|_next/image|favicon.ico|auth/callback|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
