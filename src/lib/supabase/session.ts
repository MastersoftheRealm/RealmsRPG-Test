/**
 * Supabase Session Helpers
 * =========================
 * Server-side session utilities (replaces Firebase session).
 */

import { createClient } from './server';

export interface SessionUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified?: boolean;
}

/**
 * Get the current session user.
 */
export async function getSession(): Promise<{
  user: SessionUser | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, error: error?.message ?? null };
    }

    return {
      user: {
        uid: user.id,
        email: user.email ?? undefined,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? undefined,
        picture: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? undefined,
        emailVerified: user.email_confirmed_at != null,
      },
      error: null,
    };
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
