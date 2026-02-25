/**
 * Library Server Actions
 * =======================
 * Server actions for user's library items (powers, techniques, items, creatures).
 * Uses Prisma + Supabase session.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/supabase/session';
import { rowToItem, bodyToColumnar } from '@/lib/library-columnar';

// =============================================================================
// Powers
// =============================================================================

export async function getUserPowersAction() {
  try {
    const user = await requireAuth();

    const rows = await prisma.userPower.findMany({
      where: { userId: user.uid },
      orderBy: { createdAt: 'desc' },
    });

    const powers = rows.map((r) => {
      const row = r as unknown as Record<string, unknown>;
      const item = rowToItem('powers', row, 'user');
      if (item.createdAt && typeof item.createdAt === 'object') (item as Record<string, unknown>).createdAt = (item.createdAt as Date).toISOString?.() ?? null;
      if (item.updatedAt && typeof item.updatedAt === 'object') (item as Record<string, unknown>).updatedAt = (item.updatedAt as Date).toISOString?.() ?? null;
      return item;
    });

    return { powers, error: null };
  } catch (error) {
    console.error('Error fetching powers:', error);
    return { powers: [], error: 'Failed to fetch powers' };
  }
}

export async function savePowerAction(data: {
  name: string;
  description?: string;
  parts: unknown[];
  damage?: unknown;
  actionType?: string;
  range?: unknown;
  area?: unknown;
  duration?: unknown;
  totalEN?: number;
  totalTP?: number;
}) {
  try {
    const user = await requireAuth();
    const now = new Date();
    const { scalars, payload } = bodyToColumnar('powers', { ...data, updatedAt: now });
    const created = await prisma.userPower.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.uid,
        ...scalars,
        payload: payload as object,
        createdAt: now,
        updatedAt: now,
      },
    });

    revalidatePath('/library');

    return { id: created.id, error: null };
  } catch (error) {
    console.error('Error saving power:', error);
    return { id: null, error: 'Failed to save power' };
  }
}

export async function deletePowerAction(powerId: string) {
  try {
    const user = await requireAuth();

    const existing = await prisma.userPower.findFirst({
      where: { id: powerId, userId: user.uid },
    });

    if (!existing) {
      return { success: false, error: 'Power not found' };
    }

    await prisma.userPower.delete({
      where: { id: powerId },
    });

    revalidatePath('/library');

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting power:', error);
    return { success: false, error: 'Failed to delete power' };
  }
}

// =============================================================================
// Techniques
// =============================================================================

export async function getUserTechniquesAction() {
  try {
    const user = await requireAuth();

    const rows = await prisma.userTechnique.findMany({
      where: { userId: user.uid },
      orderBy: { createdAt: 'desc' },
    });

    const techniques = rows.map((r) => {
      const row = r as unknown as Record<string, unknown>;
      const item = rowToItem('techniques', row, 'user');
      if (item.createdAt && typeof item.createdAt === 'object') (item as Record<string, unknown>).createdAt = (item.createdAt as Date).toISOString?.() ?? null;
      if (item.updatedAt && typeof item.updatedAt === 'object') (item as Record<string, unknown>).updatedAt = (item.updatedAt as Date).toISOString?.() ?? null;
      return item;
    });

    return { techniques, error: null };
  } catch (error) {
    console.error('Error fetching techniques:', error);
    return { techniques: [], error: 'Failed to fetch techniques' };
  }
}

export async function saveTechniqueAction(data: {
  name: string;
  description?: string;
  parts: unknown[];
  damage?: unknown;
  actionType?: string;
  range?: unknown;
  staminaCost?: number;
  totalTP?: number;
}) {
  try {
    const user = await requireAuth();
    const now = new Date();
    const { scalars, payload } = bodyToColumnar('techniques', { ...data, updatedAt: now });
    const created = await prisma.userTechnique.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.uid,
        ...scalars,
        payload: payload as object,
        createdAt: now,
        updatedAt: now,
      },
    });

    revalidatePath('/library');

    return { id: created.id, error: null };
  } catch (error) {
    console.error('Error saving technique:', error);
    return { id: null, error: 'Failed to save technique' };
  }
}

export async function deleteTechniqueAction(techniqueId: string) {
  try {
    const user = await requireAuth();

    const existing = await prisma.userTechnique.findFirst({
      where: { id: techniqueId, userId: user.uid },
    });

    if (!existing) {
      return { success: false, error: 'Technique not found' };
    }

    await prisma.userTechnique.delete({
      where: { id: techniqueId },
    });

    revalidatePath('/library');

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting technique:', error);
    return { success: false, error: 'Failed to delete technique' };
  }
}

// =============================================================================
// Items
// =============================================================================

export async function getUserItemsAction() {
  try {
    const user = await requireAuth();

    const rows = await prisma.userItem.findMany({
      where: { userId: user.uid },
      orderBy: { createdAt: 'desc' },
    });

    const items = rows.map((r) => {
      const row = r as unknown as Record<string, unknown>;
      const item = rowToItem('items', row, 'user');
      if (item.createdAt && typeof item.createdAt === 'object') (item as Record<string, unknown>).createdAt = (item.createdAt as Date).toISOString?.() ?? null;
      if (item.updatedAt && typeof item.updatedAt === 'object') (item as Record<string, unknown>).updatedAt = (item.updatedAt as Date).toISOString?.() ?? null;
      return item;
    });

    return { items, error: null };
  } catch (error) {
    console.error('Error fetching items:', error);
    return { items: [], error: 'Failed to fetch items' };
  }
}

export async function saveItemAction(data: {
  name: string;
  description?: string;
  type: string;
  properties: unknown[];
  goldCost?: number;
  damage?: unknown;
  armorValue?: number;
}) {
  try {
    const user = await requireAuth();
    const now = new Date();
    const { scalars, payload } = bodyToColumnar('items', { ...data, updatedAt: now });
    const created = await prisma.userItem.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.uid,
        ...scalars,
        payload: payload as object,
        createdAt: now,
        updatedAt: now,
      },
    });

    revalidatePath('/library');

    return { id: created.id, error: null };
  } catch (error) {
    console.error('Error saving item:', error);
    return { id: null, error: 'Failed to save item' };
  }
}

export async function deleteItemAction(itemId: string) {
  try {
    const user = await requireAuth();

    const existing = await prisma.userItem.findFirst({
      where: { id: itemId, userId: user.uid },
    });

    if (!existing) {
      return { success: false, error: 'Item not found' };
    }

    await prisma.userItem.delete({
      where: { id: itemId },
    });

    revalidatePath('/library');

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting item:', error);
    return { success: false, error: 'Failed to delete item' };
  }
}

// =============================================================================
// Creatures
// =============================================================================

export async function getUserCreaturesAction() {
  try {
    const user = await requireAuth();

    const rows = await prisma.userCreature.findMany({
      where: { userId: user.uid },
      orderBy: { createdAt: 'desc' },
    });

    const creatures = rows.map((r) => {
      const row = r as unknown as Record<string, unknown>;
      const item = rowToItem('creatures', row, 'user');
      if (item.createdAt && typeof item.createdAt === 'object') (item as Record<string, unknown>).createdAt = (item.createdAt as Date).toISOString?.() ?? null;
      if (item.updatedAt && typeof item.updatedAt === 'object') (item as Record<string, unknown>).updatedAt = (item.updatedAt as Date).toISOString?.() ?? null;
      return item;
    });

    return { creatures, error: null };
  } catch (error) {
    console.error('Error fetching creatures:', error);
    return { creatures: [], error: 'Failed to fetch creatures' };
  }
}

export async function saveCreatureAction(data: Record<string, unknown>) {
  try {
    const user = await requireAuth();
    const now = new Date();
    const { scalars, payload } = bodyToColumnar('creatures', { ...data, updatedAt: now });
    const created = await prisma.userCreature.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.uid,
        ...scalars,
        payload: payload as object,
        createdAt: now,
        updatedAt: now,
      },
    });

    revalidatePath('/library');

    return { id: created.id, error: null };
  } catch (error) {
    console.error('Error saving creature:', error);
    return { id: null, error: 'Failed to save creature' };
  }
}

export async function deleteCreatureAction(creatureId: string) {
  try {
    const user = await requireAuth();

    const existing = await prisma.userCreature.findFirst({
      where: { id: creatureId, userId: user.uid },
    });

    if (!existing) {
      return { success: false, error: 'Creature not found' };
    }

    await prisma.userCreature.delete({
      where: { id: creatureId },
    });

    revalidatePath('/library');

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting creature:', error);
    return { success: false, error: 'Failed to delete creature' };
  }
}
