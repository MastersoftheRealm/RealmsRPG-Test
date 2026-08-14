/**
 * Server-side `core_rules` reader.
 * ================================
 * One place that turns the `core_rules` table into the `Partial<CoreRulesMap>` shape the
 * `lib/game` formulas accept, so route handlers honour admin rules overrides the same way
 * `useGameRules()` does on the client.
 *
 * Read through the caller's (cookie-aware anon) client: the "Anyone can read core_rules"
 * RLS policy applies, and service-role stays reserved for authorized admin writes.
 * A missing table or denied read resolves to `{}` — callers fall back to code defaults
 * rather than failing the request.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CoreRulesMap } from '@/types/core-rules';

type CoreRulesRow = { id: string | null; data: unknown };

export async function fetchCoreRules(
  supabase: Pick<SupabaseClient, 'from'>
): Promise<Partial<CoreRulesMap>> {
  const { data, error } = await supabase.from('core_rules').select('id, data');
  if (error || !data) return {};

  const rules: Record<string, unknown> = {};
  for (const row of data as CoreRulesRow[]) {
    if (row?.id != null) rules[row.id] = row.data;
  }
  return rules as Partial<CoreRulesMap>;
}
