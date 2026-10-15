/**
 * Cookie-less anon client for SSG / sitemap / generateStaticParams (ADR-0021).
 * Public RLS still applies. Returns null when env is missing so builds/tests
 * without secrets can skip dynamic public paths.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/** CI / local builds: set in ui-verify.yml so `next build` never hits production. */
export const CI_BUILD_SUPABASE_URL = 'https://build-ci.invalid';

export function isPublicSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!url || !key) return false;
  if (process.env.REALMS_DISABLE_PUBLIC_SUPABASE === '1') return false;
  if (url === CI_BUILD_SUPABASE_URL) return false;
  return true;
}

export function createPublicClient() {
  if (!isPublicSupabaseConfigured()) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
  return createSupabaseClient<Database>(url, key);
}
