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
import { createSupabaseAuthCookieMethods } from '@/lib/supabase/supabase-auth-cookies';

export type ServiceRoleSupabaseClient = TypedSupabaseClient;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: createSupabaseAuthCookieMethods({
      getAll: () => cookieStore.getAll(),
      set: (name, value, options) => {
        try {
          if (options === undefined) {
            cookieStore.set(name, value);
          } else {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Ignore in Server Components (middleware handles refresh)
        }
      },
    }),
  });
}

/**
 * Service-role client — bypasses RLS. Use only for admin-only operations
 * after the request has been authorized (e.g. isAdmin() check).
 * Requires SUPABASE_SERVICE_ROLE_KEY in env.
 *
 * Return type is annotated as {@link ServiceRoleSupabaseClient} on the PR 498 branch;
 * keep this implementation compatible until that merge.
 */
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) throw new Error('Supabase service role not configured');
  return createSupabaseClient(supabaseUrl, key);
}
