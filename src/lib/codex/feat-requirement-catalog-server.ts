/**
 * Cached read of codex feat/skill rows for server legality feat-requirement checks.
 * Uses the same Data Cache path as GET /api/codex table reads.
 */

import { fromPublicTable, type TypedSupabaseClient } from '@/lib/supabase/database';
import { codexApiTableCacheTag, CODEX_API_CACHE_TAG } from '@/lib/codex/cache-tags';
import {
  CODEX_PUBLIC_ISR_SECONDS,
  readCachedPublicDataWhenValid,
} from '@/lib/supabase/cached-public-read';
import { catalogFromCodexRows, type FeatRequirementCatalog } from '@/lib/game/character-legality';

const FEAT_REQUIREMENT_COLUMNS =
  'id, name, lvl_req, ability_req, abil_req_val, skill_req, skill_req_val, mart_abil_req, speed_req, feat_lvl, base_feat_id';
const SKILL_REQUIREMENT_COLUMNS = 'id, name, base_skill, ability';

async function loadFeatRows(supabase: TypedSupabaseClient): Promise<unknown[]> {
  return readCachedPublicDataWhenValid(
    ['legality-feat-req', 'codex_feats', FEAT_REQUIREMENT_COLUMNS],
    [CODEX_API_CACHE_TAG, codexApiTableCacheTag('codex_feats')],
    CODEX_PUBLIC_ISR_SECONDS,
    async () => {
      const { data, error } = await fromPublicTable(supabase, 'codex_feats').select(
        FEAT_REQUIREMENT_COLUMNS,
      );
      if (error) throw error;
      return data ?? [];
    },
    (rows) => rows.length > 0,
  );
}

async function loadSkillRows(supabase: TypedSupabaseClient): Promise<unknown[]> {
  return readCachedPublicDataWhenValid(
    ['legality-feat-req', 'codex_skills', SKILL_REQUIREMENT_COLUMNS],
    [CODEX_API_CACHE_TAG, codexApiTableCacheTag('codex_skills')],
    CODEX_PUBLIC_ISR_SECONDS,
    async () => {
      const { data, error } = await fromPublicTable(supabase, 'codex_skills').select(
        SKILL_REQUIREMENT_COLUMNS,
      );
      if (error) throw error;
      return data ?? [];
    },
    (rows) => rows.length > 0,
  );
}

/** Throws when either catalog query fails — callers must catch and degrade to uncomputable. */
export async function fetchFeatRequirementCatalogCached(
  supabase: TypedSupabaseClient,
): Promise<FeatRequirementCatalog> {
  const [featRows, skillRows] = await Promise.all([
    loadFeatRows(supabase),
    loadSkillRows(supabase),
  ]);
  return catalogFromCodexRows(featRows, skillRows);
}
