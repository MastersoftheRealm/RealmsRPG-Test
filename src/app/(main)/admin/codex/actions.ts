'use server';

import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

type CodexCollection =
  | 'codex_feats'
  | 'codex_skills'
  | 'codex_species'
  | 'codex_traits'
  | 'codex_parts'
  | 'codex_properties'
  | 'codex_equipment'
  | 'codex_archetypes'
  | 'codex_creature_feats'
  | 'core_rules';

const COLUMNAR_COLLECTIONS: CodexCollection[] = [
  'codex_feats',
  'codex_skills',
  'codex_species',
  'codex_traits',
  'codex_parts',
  'codex_properties',
  'codex_equipment',
  'codex_archetypes',
  'codex_creature_feats',
];

async function requireAdmin() {
  const { user } = await getSession();
  if (!user?.uid) throw new Error('Authentication required');
  if (!(await isAdmin(user.uid))) throw new Error('Admin access required');
  return user.uid;
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 150);
}

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnake(s: string): string {
  return s
    .replace(/([a-zA-Z])(\d)/g, '$1_$2')
    .replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** Serialize value for columnar TEXT columns: arrays become comma-separated */
function toColumnValue(val: unknown): unknown {
  if (val == null) return null;
  if (Array.isArray(val)) return val.map(String).join(', ');
  if (typeof val === 'object' && !(val instanceof Date)) return JSON.stringify(val);
  return val;
}

const COLUMNAR_FIELDS: Record<CodexCollection, string[]> = {
  codex_feats: ['name', 'description', 'reqDesc', 'abilityReq', 'abilReqVal', 'skillReq', 'skillReqVal', 'featCatReq', 'powAbilReq', 'martAbilReq', 'powProfReq', 'martProfReq', 'speedReq', 'featLvl', 'lvlReq', 'usesPerRec', 'recPeriod', 'category', 'ability', 'tags', 'charFeat', 'stateFeat'],
  codex_skills: ['name', 'description', 'ability', 'baseSkill', 'baseSkillId', 'successDesc', 'failureDesc', 'dsCalc', 'craftFailureDesc', 'craftSuccessDesc'],
  codex_species: ['name', 'description', 'type', 'sizes', 'skills', 'speciesTraits', 'ancestryTraits', 'flaws', 'characteristics', 'aveHgtCm', 'aveWgtKg', 'aveHeight', 'aveWeight', 'adulthoodLifespan', 'languages'],
  codex_traits: ['name', 'description', 'usesPerRec', 'recPeriod', 'flaw', 'characteristic', 'optionTraitIds'],
  codex_parts: ['name', 'description', 'category', 'baseEn', 'baseTp', 'op1Desc', 'op1En', 'op1Tp', 'op2Desc', 'op2En', 'op2Tp', 'op3Desc', 'op3En', 'op3Tp', 'type', 'mechanic', 'percentage', 'duration', 'defense'],
  codex_properties: ['name', 'description', 'baseIp', 'baseTp', 'baseC', 'op1Desc', 'op1Ip', 'op1Tp', 'op1C', 'type', 'mechanic'],
  codex_equipment: ['name', 'description', 'category', 'currency', 'rarity'],
  codex_archetypes: ['name', 'type', 'description'],
  codex_creature_feats: ['name', 'description', 'featPoints', 'featLvl', 'lvlReq', 'mechanic'],
  core_rules: [],
};

/** Build create/update payload from admin payload (snake_case, arrays). Output camelCase for toDbPayload. */
function toColumnarPayload(collection: CodexCollection, data: Record<string, unknown>): Record<string, unknown> {
  const allowed = new Set(COLUMNAR_FIELDS[collection] ?? []);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'id' || key === 'data') continue;
    const camel = snakeToCamel(key);
    if (allowed.size > 0 && !allowed.has(camel)) continue;
    out[camel] = toColumnValue(value);
  }
  return out;
}

/** Convert camelCase payload to snake_case for Supabase (DB columns). Collection-specific aliases so API response keys round-trip to correct DB columns. */
function toDbPayload(collection: CodexCollection, payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (collection === 'codex_skills' && key === 'baseSkillId') {
      out.base_skill = value != null ? String(value) : null;
      continue;
    }
    if (collection === 'codex_species') {
      if (key === 'aveHeight') {
        out.ave_hgt_cm = value != null ? (typeof value === 'number' ? value : Number(value)) : null;
        continue;
      }
      if (key === 'aveWeight') {
        out.ave_wgt_kg = value != null ? (typeof value === 'number' ? value : Number(value)) : null;
        continue;
      }
    }
    out[camelToSnake(key)] = value;
  }
  return out;
}

function getTableName(collection: CodexCollection): string {
  return collection;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin env not configured');
  return createClient(url, key);
}

export async function createCodexDoc(
  collection: CodexCollection,
  id: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const docId = sanitizeId(id) || `doc_${Date.now()}`;
    const supabase = getSupabaseAdmin();
    const table = getTableName(collection);

    const { data: existing } = await supabase.from(table).select('id').eq('id', docId).maybeSingle();
    if (existing) {
      return { success: false, error: `Document ${docId} already exists` };
    }

    if (COLUMNAR_COLLECTIONS.includes(collection)) {
      const payload = toColumnarPayload(collection, data);
      const dbPayload = toDbPayload(collection, { id: docId, ...payload });
      const { error } = await supabase.from(table).insert(dbPayload);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from(table).insert({ id: docId, data });
      if (error) throw new Error(error.message);
    }

    revalidatePath('/admin/codex');
    revalidatePath('/codex');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to create' };
  }
}

export async function updateCodexDoc(
  collection: CodexCollection,
  id: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const table = getTableName(collection);

    const { data: existing } = await supabase.from(table).select('id').eq('id', id).maybeSingle();
    if (!existing) {
      return { success: false, error: 'Document not found' };
    }

    if (COLUMNAR_COLLECTIONS.includes(collection)) {
      const payload = toColumnarPayload(collection, data);
      const dbPayload = toDbPayload(collection, payload);
      const { error } = await supabase.from(table).update(dbPayload).eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from(table)
        .update({ data, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(error.message);
    }

    revalidatePath('/admin/codex');
    revalidatePath('/codex');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to update' };
  }
}

export async function deleteCodexDoc(
  collection: CodexCollection,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const table = getTableName(collection);

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw new Error(error.message);

    revalidatePath('/admin/codex');
    revalidatePath('/codex');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to delete' };
  }
}
