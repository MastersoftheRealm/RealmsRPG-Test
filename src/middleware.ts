/**
 * Next.js Middleware
 * ==================
 * Runs on every request. Currently refreshes Supabase session when migrated.
 * Firebase auth still active until Phase 4 migration.
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
