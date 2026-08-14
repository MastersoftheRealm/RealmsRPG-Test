/**
 * Characters API
 * ==============
 * List and create characters. Uses Supabase. Requires Supabase session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/supabase/session';
import { ensureUserProfile } from '@/lib/ensure-user-profile';
import { getRolePolicyForUser } from '@/lib/role-policy';
import { buildRoleQuotaExceededResponse } from '@/lib/role-quota-messages';
import { validateJson, characterCreateSchema } from '@/lib/api-validation';
import { prepareCharacterForCreate } from '@/lib/character-save';
import { normalizeCharacterForSave, normalizeCharacterOnLoad } from '@/lib/character/schema-normalize';
import { buildRateLimitKey, resolveClientIp, standardLimiter } from '@/lib/rate-limit';
import { getCharacterListColumns, resolveCharacterVisibility } from '@/lib/character-list-columns';
import { fetchArchetypeNameMap } from '@/lib/game/archetype-display';
import { fetchCoreRules } from '@/lib/core-rules-server';
import { apiErrorResponse } from '@/lib/api-error';
import {
  catalogFromCodexRows,
  findLevel1LegalityViolations,
  shouldCheckLevel1Legality,
} from '@/lib/game/character-legality';
import type { Character, CharacterSummary } from '@/types';

/** Postgres unique-violation — the idempotency index rejecting a concurrent retry. */
const UNIQUE_VIOLATION = '23505';

const FEAT_REQUIREMENT_COLUMNS =
  'id, name, lvl_req, ability_req, abil_req_val, skill_req, skill_req_val, mart_abil_req, speed_req, feat_lvl, base_feat_id';
/** Live column is `base_skill` (TEXT). App types still use `base_skill_id` after mapping. */
export const SKILL_REQUIREMENT_COLUMNS = 'id, name, base_skill, ability';
export const CHARACTER_CREATE_FAILED_MESSAGE =
  'Could not create your character. Please try again.';

type SupabaseLike = Awaited<ReturnType<typeof createClient>>;

/** The character this user already created with this idempotency key, if any. */
async function findCharacterByRequestId(
  supabase: SupabaseLike,
  userId: string,
  clientRequestId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('characters')
    .select('id')
    .eq('user_id', userId)
    .eq('client_request_id', clientRequestId)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

type CharacterInsertRow = {
  id: string;
  user_id: string;
  data: Record<string, unknown>;
  client_request_id: string | null;
} & Record<string, unknown>;

/**
 * One insert path for create and duplicate. Concurrent retries of the same
 * `client_request_id` recover the winner instead of 500ing.
 */
async function insertCharacterRow(
  supabase: SupabaseLike,
  row: CharacterInsertRow
): Promise<{ id: string } | { uniqueViolation: true }> {
  const now = new Date().toISOString();
  const { data: created, error: insertErr } = await supabase
    .from('characters')
    .insert({ created_at: now, updated_at: now, ...row })
    .select('id')
    .single();
  if (insertErr) {
    if (row.client_request_id && (insertErr as { code?: string }).code === UNIQUE_VIOLATION) {
      return { uniqueViolation: true };
    }
    throw insertErr;
  }
  return { id: created.id as string };
}

async function jsonForInsertResult(
  supabase: SupabaseLike,
  userId: string,
  clientRequestId: string | undefined,
  result: { id: string } | { uniqueViolation: true }
): Promise<NextResponse> {
  if ('id' in result) return NextResponse.json({ id: result.id });
  if (clientRequestId) {
    const replayed = await findCharacterByRequestId(supabase, userId, clientRequestId);
    if (replayed) return NextResponse.json({ id: replayed });
  }
  throw new Error('Character insert unique violation without a replay row');
}

async function fetchFeatRequirementCatalog(supabase: SupabaseLike) {
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
      .select('id, user_id, data, name, level, archetype_name, ancestry_name, status, visibility, updated_at')
      .eq('user_id', user.uid)
      .order('updated_at', { ascending: false });

    if (dbError) {
      console.error('[API Error] GET /api/characters:', dbError);
      return NextResponse.json({ error: 'Failed to load characters' }, { status: 500 });
    }

    const list = (rows ?? []) as {
      id: string;
      data: unknown;
      updated_at: string | null;
      name?: string | null;
      level?: number | null;
      archetype_name?: string | null;
      ancestry_name?: string | null;
      status?: string | null;
      visibility?: string | null;
    }[];

    const archetypeNameById = await fetchArchetypeNameMap(supabase);

    const characters: CharacterSummary[] = list.map((r) => {
      const d = (r.data as Record<string, unknown>) ?? {};
      const listCols = getCharacterListColumns(d, { archetypeNameById });
      const archName = listCols.archetype_name ?? r.archetype_name ?? undefined;
      return {
        id: r.id,
        name: r.name ?? (d.name as string) ?? 'Unnamed',
        level: r.level ?? (d.level as number) ?? 1,
        portrait: d.portrait as string | undefined,
        archetypeName: archName ?? undefined,
        ancestryName: r.ancestry_name ?? (d.ancestry as { name?: string })?.name ?? (d.species as string),
        status: (r.status as CharacterSummary['status']) ?? (d.status as CharacterSummary['status']),
        visibility: resolveCharacterVisibility({ visibility: r.visibility, data: d }),
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
      buildRateLimitKey('char-post', { userId: user.uid, ip: resolveClientIp(request.headers) })
    );
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
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
        { status: 403 }
      );
    }

    if (duplicateOf) {
      const { data: existing, error: existingErr } = await supabase
        .from('characters')
        .select('id, data')
        .eq('id', duplicateOf)
        .eq('user_id', user.uid)
        .maybeSingle();
      if (existingErr) throw existingErr;
      if (!existing) {
        return NextResponse.json({ error: 'Character not found' }, { status: 404 });
      }
      const d = (existing.data as Record<string, unknown>) ?? {};
      const baseData = normalizeCharacterOnLoad({ ...d });
      delete baseData.createdAt;
      delete baseData.updatedAt;
      const newData = {
        ...baseData,
        name: `${(baseData.name as string) || 'Unnamed'} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      normalizeCharacterForSave(newData);
      const archetypeNameById = await fetchArchetypeNameMap(supabase);
      const listCols = getCharacterListColumns(newData as Record<string, unknown>, { archetypeNameById });
      const newId = crypto.randomUUID();

      await ensureUserProfile(supabase, user.uid);

      const inserted = await insertCharacterRow(supabase, {
        id: newId,
        user_id: user.uid,
        data: newData,
        ...listCols,
        client_request_id: clientRequestId ?? null,
      });
      return jsonForInsertResult(supabase, user.uid, clientRequestId, inserted);
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
          { status: 400 }
        );
      }
    }

    const archetypeNameById = await fetchArchetypeNameMap(supabase);
    const listCols = getCharacterListColumns(cleanedData as Record<string, unknown>, { archetypeNameById });
    const newId = crypto.randomUUID();

    await ensureUserProfile(supabase, user.uid);

    const inserted = await insertCharacterRow(supabase, {
      id: newId,
      user_id: user.uid,
      data: cleanedData,
      ...listCols,
      client_request_id: clientRequestId ?? null,
    });
    return jsonForInsertResult(supabase, user.uid, clientRequestId, inserted);
  } catch (err) {
    return apiErrorResponse(CHARACTER_CREATE_FAILED_MESSAGE, 500, 'POST /api/characters', err);
  }
}
