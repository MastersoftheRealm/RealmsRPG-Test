/**
 * Admin Helpers
 * ==============
 * Server-side utilities for admin role checks.
 * Source of truth: user_profiles.role in Supabase.
 */

import { createClient } from '@/lib/supabase/server';

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
  } catch {
    return false;
  }
}
