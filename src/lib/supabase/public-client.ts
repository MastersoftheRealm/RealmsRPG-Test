/**
 * Cookie-less anon client for SSG / sitemap / generateStaticParams (ADR-0021).
 * Public RLS still applies. Returns null when env is missing so builds/tests
 * without secrets can skip dynamic public paths.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!url || !key) return null;
  return createSupabaseClient<Database>(url, key);
}
