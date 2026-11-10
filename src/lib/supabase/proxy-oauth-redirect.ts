/**
 * Edge proxy helper: misrouted OAuth `?code=` lands on `/` when Site URL is `/`.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';

export function shouldRedirectOAuthCodeFromRoot(pathname: string, code: string | null): boolean {
  if (!code) return false;
  return pathname === '/';
}

export function redirectOAuthCodeToCallback(request: NextRequest): NextResponse | null {
  const code = request.nextUrl.searchParams.get('code');
  if (!shouldRedirectOAuthCodeFromRoot(request.nextUrl.pathname, code)) {
    return null;
  }

  const callbackUrl = request.nextUrl.clone();
  callbackUrl.pathname = '/auth/callback';
  callbackUrl.searchParams.set('code', code!);
  callbackUrl.searchParams.set(
    'next',
    sanitizeRedirectPath(request.nextUrl.searchParams.get('next')),
  );
  return NextResponse.redirect(callbackUrl);
}
