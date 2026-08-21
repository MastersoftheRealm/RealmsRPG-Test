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
 * Supplies created_at and updated_at so NOT NULL constraints are met even when
 * the table has no DEFAULT.
 */
export async function ensureUserProfile(supabase: TypedSupabaseClient, uid: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('user_profiles').upsert(
    {
      id: uid,
      created_at: now,
      updated_at: now,
    },
    { onConflict: 'id' },
  );
  if (error) throw error;
}
