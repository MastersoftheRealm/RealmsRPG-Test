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

import type { CoreRulesMap } from '@/types/core-rules';
import type { TypedSupabaseClient } from '@/lib/supabase/database';
import { CORE_RULES_CACHE_TAG } from '@/lib/codex/cache-tags';
import { CODEX_PUBLIC_ISR_SECONDS, readCachedPublicData } from '@/lib/supabase/cached-public-read';

export function resetCoreRulesCacheForTests(): void {
  // Tests mock `unstable_cache` as a passthrough; nothing to reset.
}

async function loadCoreRulesFromSupabase(
  supabase: Pick<TypedSupabaseClient, 'from'>,
): Promise<Partial<CoreRulesMap>> {
  const { data, error } = await supabase.from('core_rules').select('id, data');
  if (error || !data) return {};

  const rules: Record<string, unknown> = {};
  for (const row of data) {
    rules[row.id] = row.data;
  }
  return rules as Partial<CoreRulesMap>;
}

export async function fetchCoreRules(
  supabase: Pick<TypedSupabaseClient, 'from'>,
): Promise<Partial<CoreRulesMap>> {
  return readCachedPublicData(
    ['core-rules', 'id,data'],
    [CORE_RULES_CACHE_TAG],
    CODEX_PUBLIC_ISR_SECONDS,
    () => loadCoreRulesFromSupabase(supabase),
  );
}
