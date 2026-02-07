'use server';

import { getSession } from '@/lib/firebase/session';
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
  | 'codex_creature_feats';

async function requireAdmin() {
  const { user } = await getSession();
  if (!user?.uid) throw new Error('Authentication required');
  if (!(await isAdmin(user.uid))) throw new Error('Admin access required');
  return user.uid;
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 150);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CodexDelegate = { findUnique: (args: any) => Promise<unknown>; create: (args: any) => Promise<unknown>; update: (args: any) => Promise<unknown>; delete: (args: any) => Promise<unknown> };

function getCodexDelegates(collection: CodexCollection): CodexDelegate {
  switch (collection) {
    case 'codex_feats': return prisma.codexFeat as CodexDelegate;
    case 'codex_skills': return prisma.codexSkill as CodexDelegate;
    case 'codex_species': return prisma.codexSpecies as CodexDelegate;
    case 'codex_traits': return prisma.codexTrait as CodexDelegate;
    case 'codex_parts': return prisma.codexPart as CodexDelegate;
    case 'codex_properties': return prisma.codexProperty as CodexDelegate;
    case 'codex_equipment': return prisma.codexEquipment as CodexDelegate;
    case 'codex_archetypes': return prisma.codexArchetype as CodexDelegate;
    case 'codex_creature_feats': return prisma.codexCreatureFeat as CodexDelegate;
    default: throw new Error(`Unknown collection: ${collection}`);
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

    await delegate.create({
      data: { id: docId, data },
    });

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

    await delegate.update({
      where: { id },
      data: { data },
    });

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
