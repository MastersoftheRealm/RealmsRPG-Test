/**
 * Supabase Session Helpers
 * =========================
 * Server-side session utilities.
 */

import type { JwtPayload } from '@supabase/supabase-js';
import { createClient } from './server';
import { getVerifiedClaims } from './verified-claims';

export interface SessionUser {
  uid: string;
  email?: string | undefined;
  name?: string | undefined;
  picture?: string | undefined;
  emailVerified?: boolean | undefined;
}

function claimString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * Identity is `sub` only. Name and picture are display fields carried in the
 * token the same way `getUser()` exposed `user_metadata` — they are not used
 * for authorization.
 */
export function sessionUserFromClaims(claims: JwtPayload | null | undefined): SessionUser | null {
  const uid = claimString(claims?.sub);
  if (!uid) return null;
  const meta = claims?.user_metadata;
  const emailVerified =
    claimString(claims?.email_confirmed_at) != null || meta?.email_verified === true
      ? true
      : undefined;
  return {
    uid,
    email: claimString(claims?.email),
    name: claimString(meta?.full_name) ?? claimString(meta?.name),
    picture: claimString(meta?.avatar_url) ?? claimString(meta?.picture),
    emailVerified,
  };
}

/**
 * Get the current session user.
 * Verifies the access token locally (`getClaims`) instead of calling Auth's
 * `/user` endpoint on every request.
 */
export async function getSession(): Promise<{
  user: SessionUser | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { claims, error } = await getVerifiedClaims(supabase);
    if (error) {
      return { user: null, error: error.message };
    }
    return { user: sessionUserFromClaims(claims), error: null };
  } catch (err) {
    console.error('Error getting session:', err);
    return { user: null, error: 'Invalid session' };
  }
}

/**
 * Get the current user's ID or null.
 */
export async function getSessionUserId(): Promise<string | null> {
  const { user } = await getSession();
  return user?.uid ?? null;
}

/**
 * Require auth — throws if not authenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
  const { user, error } = await getSession();
  if (!user) {
    throw new Error(error ?? 'Authentication required');
  }
  return user;
}
