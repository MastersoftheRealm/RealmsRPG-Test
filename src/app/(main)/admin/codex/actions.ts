'use server';

import { getSession } from '@/lib/supabase/session';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
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

/** Serialize value for columnar TEXT columns: arrays become comma-separated */
function toColumnValue(val: unknown): unknown {
  if (val == null) return null;
  if (Array.isArray(val)) return val.map(String).join(', ');
  if (typeof val === 'object' && !(val instanceof Date)) return JSON.stringify(val);
  return val;
}

const COLUMNAR_FIELDS: Record<CodexCollection, string[]> = {
  codex_feats: ['name', 'description', 'reqDesc', 'abilityReq', 'abilReqVal', 'skillReq', 'skillReqVal', 'featCatReq', 'powAbilReq', 'martAbilReq', 'powProfReq', 'martProfReq', 'speedReq', 'featLvl', 'lvlReq', 'usesPerRec', 'recPeriod', 'category', 'ability', 'tags', 'charFeat', 'stateFeat'],
  codex_skills: ['name', 'description', 'ability', 'baseSkill', 'successDesc', 'failureDesc', 'dsCalc', 'craftFailureDesc', 'craftSuccessDesc'],
  codex_species: ['name', 'description', 'type', 'sizes', 'skills', 'speciesTraits', 'ancestryTraits', 'flaws', 'characteristics', 'aveHgtCm', 'aveWgtKg', 'adulthoodLifespan', 'languages'],
  codex_traits: ['name', 'description', 'usesPerRec', 'recPeriod', 'flaw', 'characteristic', 'optionTraitIds'],
  codex_parts: ['name', 'description', 'category', 'baseEn', 'baseTp', 'op1Desc', 'op1En', 'op1Tp', 'op2Desc', 'op2En', 'op2Tp', 'op3Desc', 'op3En', 'op3Tp', 'type', 'mechanic', 'percentage', 'duration', 'defense'],
  codex_properties: ['name', 'description', 'baseIp', 'baseTp', 'baseC', 'op1Desc', 'op1Ip', 'op1Tp', 'op1C', 'type', 'mechanic'],
  codex_equipment: ['name', 'description', 'category', 'currency', 'rarity'],
  codex_archetypes: ['name', 'type', 'description'],
  codex_creature_feats: ['name', 'description', 'featPoints', 'featLvl', 'lvlReq', 'mechanic'],
  core_rules: [],
};

/** Build Prisma create/update payload from admin payload (snake_case, arrays) */
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CodexDelegate = { findUnique: (args: any) => Promise<unknown>; create: (args: any) => Promise<unknown>; update: (args: any) => Promise<unknown>; delete: (args: any) => Promise<unknown> };

function getCodexDelegates(collection: CodexCollection): CodexDelegate {
  switch (collection) {
    case 'codex_feats':
      return prisma.codexFeat as CodexDelegate;
    case 'codex_skills':
      return prisma.codexSkill as CodexDelegate;
    case 'codex_species':
      return prisma.codexSpecies as CodexDelegate;
    case 'codex_traits':
      return prisma.codexTrait as CodexDelegate;
    case 'codex_parts':
      return prisma.codexPart as CodexDelegate;
    case 'codex_properties':
      return prisma.codexProperty as CodexDelegate;
    case 'codex_equipment':
      return prisma.codexEquipment as CodexDelegate;
    case 'codex_archetypes':
      return prisma.codexArchetype as CodexDelegate;
    case 'codex_creature_feats':
      return prisma.codexCreatureFeat as CodexDelegate;
    case 'core_rules':
      return prisma.coreRules as CodexDelegate;
    default:
      throw new Error(`Unknown collection: ${collection}`);
  }
}

export async function createCodexDoc(
  collection: CodexCollection,
  id: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const docId = sanitizeId(id) || `doc_${Date.now()}`;
    const delegate = getCodexDelegates(collection);

    const existing = await delegate.findUnique({ where: { id: docId } });
    if (existing) {
      return { success: false, error: `Document ${docId} already exists` };
    }

    if (COLUMNAR_COLLECTIONS.includes(collection)) {
      const payload = toColumnarPayload(collection, data) as Record<string, unknown>;
      await delegate.create({
        data: { id: docId, ...payload },
      });
    } else {
      await delegate.create({
        data: { id: docId, data },
      });
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
    const delegate = getCodexDelegates(collection);

    const existing = await delegate.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Document not found' };
    }

    if (COLUMNAR_COLLECTIONS.includes(collection)) {
      const payload = toColumnarPayload(collection, data) as Record<string, unknown>;
      await delegate.update({
        where: { id },
        data: payload,
      });
    } else {
      await delegate.update({
        where: { id },
        data: { data },
      });
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
    const delegate = getCodexDelegates(collection);

    await delegate.delete({
      where: { id },
    });

    revalidatePath('/admin/codex');
    revalidatePath('/codex');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to delete' };
  }
}
