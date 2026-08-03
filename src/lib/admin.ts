/**
 * Admin Helpers
 * ==============
 * Server-side utilities for admin role checks.
 * Source of truth: user_profiles.role in Supabase.
 */

import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { logApiError } from '@/lib/api-error';

export type AdminSessionResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; body: { error: string } };

/**
 * Check if a user ID is an admin.
 * Reads from user_profiles.role in Supabase.
 * Client-side: use /api/admin/check endpoint via useAdmin hook.
 */
export async function isAdmin(uid: string | null | undefined): Promise<boolean> {
  if (!uid) return false;

  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', uid)
      .maybeSingle();
    return (profile as { role?: string } | null)?.role === 'admin';
  } catch (err) {
    logApiError(`isAdmin(${uid})`, err);
    return false;
  }
}

/**
 * Require an authenticated admin session for API routes and server actions.
 * Returns the admin user id on success; otherwise a status + error body.
 */
export async function requireAdminSession(): Promise<AdminSessionResult> {
  const { user, error } = await getSession();
  if (error || !user?.uid) {
    return { ok: false, status: 401, body: { error: 'Unauthorized' } };
  }
  if (!(await isAdmin(user.uid))) {
    return { ok: false, status: 403, body: { error: 'Forbidden' } };
  }
  return { ok: true, userId: user.uid };
}
