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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
