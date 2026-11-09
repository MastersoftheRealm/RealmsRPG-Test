/**
 * Edge/proxy helpers for Supabase Auth cookie detection (session refresh gating).
 */

import type { NextRequest } from 'next/server';

/** Matches @supabase/ssr chunked session cookies (`sb-<ref>-auth-token`, `.0`, …). */
const SUPABASE_AUTH_SESSION_COOKIE = /^sb-.+-auth-token(?:\.\d+)?$/;

export function isSupabaseAuthSessionCookieName(name: string): boolean {
  return SUPABASE_AUTH_SESSION_COOKIE.test(name);
}

export function hasSupabaseAuthSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => isSupabaseAuthSessionCookieName(cookie.name));
}

/** Next.js link / router prefetch and segment prefetch (skip token refresh when safe). */
export function isNextLinkPrefetchRequest(request: NextRequest): boolean {
  const headers = request.headers;
  if (headers.get('x-middleware-prefetch') === '1') return true;
  const routerPrefetch = headers.get('next-router-prefetch');
  if (routerPrefetch === '1' || routerPrefetch === '2' || routerPrefetch === '3') return true;
  if (headers.get('next-router-segment-prefetch')) return true;
  const purpose = headers.get('purpose') ?? headers.get('sec-purpose');
  if (purpose?.toLowerCase() === 'prefetch') return true;
  return false;
}
