/**
 * Supabase Session Helpers
 * =========================
 * Server-side session utilities.
 */

import type { JwtPayload, User } from '@supabase/supabase-js';
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
 * `/user` endpoint on every request. A revoked or banned session stays valid
 * until the access token expires — sensitive writes use `requireLiveUser`.
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
 * Require auth — throws if not authenticated.
 * Uses the local token check. High-assurance writes use `requireLiveUser`.
 */
export async function requireAuth(): Promise<SessionUser> {
  const { user, error } = await getSession();
  if (!user) {
    throw new Error(error ?? 'Authentication required');
  }
  return user;
}

function sessionUserFromAuthUser(user: User): SessionUser | null {
  const uid = claimString(user.id);
  if (!uid) return null;
  const meta = user.user_metadata;
  return {
    uid,
    email: claimString(user.email),
    name: claimString(meta?.full_name) ?? claimString(meta?.name),
    picture: claimString(meta?.avatar_url) ?? claimString(meta?.picture),
    emailVerified: claimString(user.email_confirmed_at) != null ? true : undefined,
  };
}

/**
 * Confirm the caller with Auth's `/user` endpoint.
 * Use this only for high-assurance writes (account deletion, admin mutations
 * that run with the service role, and email or privilege changes). Ordinary
 * reads stay on `getSession` / `getClaims`, which do not notice a revoked or
 * banned session until the access token expires.
 */
export async function requireLiveUser(): Promise<SessionUser> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user ? sessionUserFromAuthUser(data.user) : null;
  if (error || !user) {
    throw new Error('Authentication required');
  }
  return user;
}
