/**
 * Characters API
 * ==============
 * List and create characters. Uses Supabase. Requires Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TypedSupabaseClient } from '@/lib/supabase/database';
import { getSession } from '@/lib/supabase/session';
import { ensureUserProfile } from '@/lib/ensure-user-profile';
import { getRolePolicyForUser } from '@/lib/role-policy';
import { buildRoleQuotaExceededResponse } from '@/lib/role-quota-messages';
import { validateJson, characterCreateSchema } from '@/lib/api-validation';
import { prepareCharacterForCreate } from '@/lib/character-save';
import {
  normalizeCharacterForSave,
  normalizeCharacterOnLoad,
} from '@/lib/character/schema-normalize';
import { buildRateLimitKey, resolveClientIp, standardLimiter } from '@/lib/rate-limit';
import { resolveCharacterVisibility } from '@/lib/character-list-columns';
import { fetchCoreRules } from '@/lib/core-rules-server';
import {
  createRelationalCharacter,
  getRelationalCharacterDocument,
} from '@/lib/character-persistence-server';
import { apiErrorResponse } from '@/lib/api-error';
import {
  catalogFromCodexRows,
  findLevel1LegalityViolations,
  shouldCheckLevel1Legality,
} from '@/lib/game/character-legality';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import type { Character, CharacterSummary } from '@/types';

const FEAT_REQUIREMENT_COLUMNS =
  'id, name, lvl_req, ability_req, abil_req_val, skill_req, skill_req_val, mart_abil_req, speed_req, feat_lvl, base_feat_id';
/** Live column is `base_skill` (TEXT). App types still use `base_skill_id` after mapping. */
const SKILL_REQUIREMENT_COLUMNS = 'id, name, base_skill, ability';

/** The character this user already created with this idempotency key, if any. */
async function findCharacterByRequestId(
  supabase: TypedSupabaseClient,
  userId: string,
  clientRequestId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('characters')
    .select('id')
    .eq('user_id', userId)
    .eq('client_request_id', clientRequestId)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

async function fetchFeatRequirementCatalog(supabase: TypedSupabaseClient) {
  const [featRes, skillRes] = await Promise.all([
    supabase.from('codex_feats').select(FEAT_REQUIREMENT_COLUMNS),
    supabase.from('codex_skills').select(SKILL_REQUIREMENT_COLUMNS),
  ]);
  if (featRes.error) throw featRes.error;
  if (skillRes.error) throw skillRes.error;
  return catalogFromCodexRows(featRes.data ?? [], skillRes.data ?? []);
}

export async function GET() {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: rows, error: dbError } = await supabase
      .from('characters')
      .select(
        'id, name, level, portrait, archetype_name, ancestry_name, status, visibility, updated_at',
      )
      .eq('user_id', user.uid)
      .order('updated_at', { ascending: false });

    if (dbError) {
      console.error('[API Error] GET /api/characters:', dbError);
      return NextResponse.json({ error: 'Failed to load characters' }, { status: 500 });
    }

    const list = (rows ?? []) as {
      id: string;
      updated_at: string | null;
      name?: string | null | undefined;
      level?: number | null | undefined;
      portrait?: string | null | undefined;
      archetype_name?: string | null | undefined;
      ancestry_name?: string | null | undefined;
      status?: string | null | undefined;
      visibility?: string | null | undefined;
    }[];

    const characters: CharacterSummary[] = list.map((r) => {
      return {
        id: r.id,
        name: r.name ?? 'Unnamed',
        level: r.level ?? 1,
        portrait: r.portrait ?? undefined,
        archetypeName: r.archetype_name ?? undefined,
        ancestryName: r.ancestry_name ?? undefined,
        status: r.status as CharacterSummary['status'],
        visibility: resolveCharacterVisibility({ visibility: r.visibility }),
        updatedAt: r.updated_at ?? undefined,
      };
    });

    return NextResponse.json(characters);
  } catch (err) {
    console.error('[API Error] GET /api/characters:', err);
    return NextResponse.json({ error: 'Failed to load characters' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getSession();
    if (error || !user?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await standardLimiter.check(
      buildRateLimitKey('char-post', { userId: user.uid, ip: resolveClientIp(request.headers) }),
    );
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const validation = await validateJson(request, characterCreateSchema);
    if (!validation.success) return validation.error;
    const { duplicateOf, clientRequestId, ...rest } = validation.data;
    const data = rest as Partial<Character>;

    const supabase = await createClient();

    // Idempotent replay ahead of the quota check: a retry after a lost response must not
    // be refused because the first attempt already consumed the caller's last slot.
    if (clientRequestId) {
      const replayed = await findCharacterByRequestId(supabase, user.uid, clientRequestId);
      if (replayed) return NextResponse.json({ id: replayed });
    }

    const rolePolicy = await getRolePolicyForUser(user.uid, supabase);
    const { count: characterCount, error: countError } = await supabase
      .from('characters')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.uid);
    if (countError) throw countError;
    if ((characterCount ?? 0) >= rolePolicy.maxCharacters) {
      return NextResponse.json(
        buildRoleQuotaExceededResponse({
          role: rolePolicy.role,
          resource: 'characters',
          currentCount: characterCount ?? 0,
          maxAllowed: rolePolicy.maxCharacters,
        }),
        { status: 403 },
      );
    }

    if (duplicateOf) {
      const { data: existing, error: existingErr } = await supabase
        .from('characters')
        .select('id')
        .eq('id', duplicateOf)
        .eq('user_id', user.uid)
        .maybeSingle();
      if (existingErr) throw existingErr;
      if (!existing) {
        return NextResponse.json({ error: 'Character not found' }, { status: 404 });
      }
      const relational = await getRelationalCharacterDocument(supabase, duplicateOf);
      if (!relational) {
        return NextResponse.json({ error: 'Character not found' }, { status: 404 });
      }
      const baseData = normalizeCharacterOnLoad({ ...relational });
      delete baseData.createdAt;
      delete baseData.updatedAt;
      const newData = {
        ...baseData,
        name: `${(baseData.name as string) || 'Unnamed'} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      normalizeCharacterForSave(newData);
      const newId = crypto.randomUUID();

      await ensureUserProfile(supabase, user.uid);

      const inserted = await createRelationalCharacter(supabase, {
        characterId: newId,
        document: newData,
        clientRequestId,
      });
      return NextResponse.json({ id: inserted.id });
    }

    const cleanedData = prepareCharacterForCreate(data);

    // Server-side legality floor (report 03 P1-7). Bounds only — an over-budget payload is
    // refused, an under-filled one is not, so this can never 400 a build a creator allowed.
    // Feat requirements are not a budget: unmet official-catalog feats are refused.
    if (shouldCheckLevel1Legality(cleanedData)) {
      const [rules, featCatalog] = await Promise.all([
        fetchCoreRules(supabase),
        fetchFeatRequirementCatalog(supabase),
      ]);
      const violations = findLevel1LegalityViolations(cleanedData, rules, featCatalog);
      if (violations.length > 0) {
        return NextResponse.json(
          { error: 'Character is not a legal level 1 build', details: violations },
          { status: 400 },
        );
      }
    }

    const newId = crypto.randomUUID();

    await ensureUserProfile(supabase, user.uid);

    const inserted = await createRelationalCharacter(supabase, {
      characterId: newId,
      document: cleanedData as Record<string, unknown>,
      clientRequestId,
    });
    return NextResponse.json({ id: inserted.id });
  } catch (err) {
    return apiErrorResponse(
      GUIDED_CREATOR_COPY.steps.reveal.saveFailed,
      500,
      'POST /api/characters',
      err,
    );
  }
}
