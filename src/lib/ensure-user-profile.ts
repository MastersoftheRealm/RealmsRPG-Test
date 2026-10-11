/**
 * Ensure user profile exists before writing to user-scoped tables
 * ==============================================================
 * user_items, user_powers, etc. have FK to user_profiles. If created_at/updated_at
 * are NOT NULL and have no DEFAULT, upsert must supply them so the row can be created.
 */

import type { TypedSupabaseClient } from '@/lib/supabase/database';

/**
 * Ensures a row exists in user_profiles for the given uid so that inserts into
 * user_items, user_powers, user_techniques, user_creatures, etc. satisfy the FK.
 * Sends updated_at only. created_at has a database default, and the session
 * client cannot UPDATE created_at (86e3jt562).
 */
export async function ensureUserProfile(supabase: TypedSupabaseClient, uid: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('user_profiles').upsert(
    {
      id: uid,
      updated_at: now,
    },
    { onConflict: 'id' },
  );
  if (error) throw error;
}
