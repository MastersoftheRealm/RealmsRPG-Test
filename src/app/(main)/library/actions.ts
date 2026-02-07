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
      const d = r.data as Record<string, unknown>;
      return {
        id: r.id,
        ...d,
        createdAt: r.createdAt?.toISOString() ?? null,
        updatedAt: r.updatedAt?.toISOString() ?? null,
      };
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

    const powerData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await prisma.userPower.create({
      data: {
        userId: user.uid,
        data: powerData as object,
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
      const d = r.data as Record<string, unknown>;
      return {
        id: r.id,
        ...d,
        createdAt: r.createdAt?.toISOString() ?? null,
        updatedAt: r.updatedAt?.toISOString() ?? null,
      };
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

    const techniqueData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await prisma.userTechnique.create({
      data: {
        userId: user.uid,
        data: techniqueData as object,
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
      const d = r.data as Record<string, unknown>;
      return {
        id: r.id,
        ...d,
        createdAt: r.createdAt?.toISOString() ?? null,
        updatedAt: r.updatedAt?.toISOString() ?? null,
      };
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

    const itemData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await prisma.userItem.create({
      data: {
        userId: user.uid,
        data: itemData as object,
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
      const d = r.data as Record<string, unknown>;
      return {
        id: r.id,
        ...d,
        createdAt: r.createdAt?.toISOString() ?? null,
        updatedAt: r.updatedAt?.toISOString() ?? null,
      };
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

    const creatureData = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await prisma.userCreature.create({
      data: {
        userId: user.uid,
        data: creatureData as object,
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
