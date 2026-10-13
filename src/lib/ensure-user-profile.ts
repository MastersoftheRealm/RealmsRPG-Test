/**
 * Ensure a user_profiles row exists before writes to user-scoped tables.
 * Library tables and characters reference user_profiles.
 *
 * Session grants (86e3jt562) are INSERT (id, display_name, created_at,
 * updated_at) and UPDATE (display_name, updated_at), plus SELECT. Upsert is
 * INSERT ... ON CONFLICT DO UPDATE. PostgREST updates every inserted column
 * on conflict, including id, which this role cannot UPDATE. Postgres reports
 * that as 42501 "permission denied for table user_profiles", so
 * POST /api/user/library/[type] returned 500. An existing row is left
 * untouched. A missing row is inserted with only the granted columns.
 */

import type { TypedSupabaseClient } from '@/lib/supabase/database';

const UNIQUE_VIOLATION = '23505';

export async function ensureUserProfile(supabase: TypedSupabaseClient, uid: string): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', uid)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return;

  const now = new Date().toISOString();
  const { error: insertError } = await supabase.from('user_profiles').insert(
    {
      id: uid,
      created_at: now,
      updated_at: now,
    },
    { defaultToNull: false },
  );
  if (!insertError) return;
  if (insertError.code === UNIQUE_VIOLATION) return;
  throw insertError;
}
