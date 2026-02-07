'use server';

import { getSession } from '@/lib/firebase/session';
import { isAdmin } from '@/lib/admin';
import { getAdminFirestore } from '@/lib/firebase/server';
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

export async function createCodexDoc(
  collection: CodexCollection,
  id: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();
    const docId = sanitizeId(id) || `doc_${Date.now()}`;
    const db = getAdminFirestore();
    const ref = db.collection(collection).doc(docId);
    const exists = (await ref.get()).exists;
    if (exists) {
      return { success: false, error: `Document ${docId} already exists` };
    }
    await ref.set(data);
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
    const db = getAdminFirestore();
    const ref = db.collection(collection).doc(id);
    if (!(await ref.get()).exists) {
      return { success: false, error: 'Document not found' };
    }
    await ref.update(data);
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
    const db = getAdminFirestore();
    const ref = db.collection(collection).doc(id);
    await ref.delete();
    revalidatePath('/admin/codex');
    revalidatePath('/codex');
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to delete' };
  }
}
