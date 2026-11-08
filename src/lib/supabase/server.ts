import 'server-only';

/**
 * Supabase Server Client
 * ======================
 * For use in Server Components and Server Actions.
 * Cookie-aware for session handling.
 * All app tables live in the public schema (Path C); no custom schemas.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { TypedSupabaseClient } from '@/lib/supabase/database';

export type { TypedSupabaseClient as ServiceRoleSupabaseClient };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Ignore in Server Components (middleware handles refresh)
        }
      },
    },
  });
}

/**
 * Service-role client — bypasses RLS. Use only for admin-only operations
 * after the request has been authorized (e.g. isAdmin() check).
 * Requires SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * Returns an untyped client today; the service-role shape is `ServiceRoleSupabaseClient`
 * (`TypedSupabaseClient`). Full factory generics are deferred while #497 migrates
 * dynamic `.from(variable)` call sites to `fromPublicTable`.
 */
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) throw new Error('Supabase service role not configured');
  return createSupabaseClient(supabaseUrl, key);
}
