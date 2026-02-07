/**
 * Supabase Browser Client
 * =======================
 * For use in Client Components.
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
