/**
 * Character Server Actions
 * =========================
 * Server actions for character CRUD operations.
 * Uses Prisma + Supabase session.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/supabase/session';
import { removeUndefined } from '@/lib/utils';
import type { Character } from '@/types';

function prepareForSave(data: Partial<Character>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...dataToSave } = data;

  const cleaned = { ...dataToSave } as Record<string, unknown>;
  delete cleaned._displayFeats;
  delete cleaned.allTraits;
  delete cleaned.defenses;
  delete cleaned.defenseBonuses;

  cleaned.updatedAt = new Date().toISOString();
  return removeUndefined(cleaned);
}

export async function getCharactersAction() {
  try {
    const user = await requireAuth();

    const rows = await prisma.character.findMany({
      where: { userId: user.uid },
      orderBy: { updatedAt: 'desc' },
    });

    const characters = rows.map((r) => {
      const d = r.data as Record<string, unknown>;
      return {
        id: r.id,
        name: (d.name as string) || 'Unnamed',
        level: (d.level as number) || 1,
        portrait: d.portrait as string | undefined,
        archetypeName: (d.archetype as { name?: string })?.name,
        ancestryName: (d.ancestry as { name?: string })?.name,
        status: d.status as string | undefined,
        updatedAt: r.updatedAt?.toISOString() ?? null,
      };
    });

    return { characters, error: null };
  } catch (error) {
    console.error('Error fetching characters:', error);
    return { characters: [], error: 'Failed to fetch characters' };
  }
}

export async function getCharacterAction(characterId: string) {
  try {
    const user = await requireAuth();

    const row = await prisma.character.findFirst({
      where: { id: characterId, userId: user.uid },
    });

    if (!row) {
      return { character: null, error: 'Character not found' };
    }

    const d = row.data as Record<string, unknown>;
    const character = {
      id: row.id,
      ...d,
      createdAt: (d.createdAt as string) ?? row.createdAt?.toISOString() ?? null,
      updatedAt: (d.updatedAt as string) ?? row.updatedAt?.toISOString() ?? null,
    };

    return { character, error: null };
  } catch (error) {
    console.error('Error fetching character:', error);
    return { character: null, error: 'Failed to fetch character' };
  }
}

export async function createCharacterAction(data: Partial<Character>) {
  try {
    const user = await requireAuth();

    const cleanedData = prepareForSave(data);
    cleanedData.createdAt = new Date().toISOString();

    await prisma.userProfile.upsert({
      where: { id: user.uid },
      create: { id: user.uid },
      update: {},
    });

    const created = await prisma.character.create({
      data: {
        userId: user.uid,
        data: cleanedData as object,
      },
    });

    revalidatePath('/characters');

    return { id: created.id, error: null };
  } catch (error) {
    console.error('Error creating character:', error);
    return { id: null, error: 'Failed to create character' };
  }
}

export async function updateCharacterAction(characterId: string, data: Partial<Character>) {
  try {
    const user = await requireAuth();

    const cleanedData = prepareForSave(data);

    const existing = await prisma.character.findFirst({
      where: { id: characterId, userId: user.uid },
    });

    if (!existing) {
      return { success: false, error: 'Character not found' };
    }

    const currentData = (existing.data as Record<string, unknown>) ?? {};
    const merged = { ...currentData, ...cleanedData };

    await prisma.character.update({
      where: { id: characterId },
      data: { data: merged as object },
    });

    revalidatePath('/characters');
    revalidatePath(`/characters/${characterId}`);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating character:', error);
    return { success: false, error: 'Failed to update character' };
  }
}

export async function deleteCharacterAction(characterId: string) {
  try {
    const user = await requireAuth();

    const existing = await prisma.character.findFirst({
      where: { id: characterId, userId: user.uid },
    });

    if (!existing) {
      return { success: false, error: 'Character not found' };
    }

    await prisma.character.delete({
      where: { id: characterId },
    });

    revalidatePath('/characters');

    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting character:', error);
    return { success: false, error: 'Failed to delete character' };
  }
}

export async function duplicateCharacterAction(characterId: string) {
  try {
    const user = await requireAuth();

    const existing = await prisma.character.findFirst({
      where: { id: characterId, userId: user.uid },
    });

    if (!existing) {
      return { id: null, error: 'Character not found' };
    }

    const d = existing.data as Record<string, unknown>;
    const baseData = { ...d };
    delete baseData.createdAt;
    delete baseData.updatedAt;
    const newData = {
      ...baseData,
      name: `${(baseData.name as string) || 'Unnamed'} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await prisma.character.create({
      data: {
        userId: user.uid,
        data: newData as object,
      },
    });

    revalidatePath('/characters');

    return { id: created.id, error: null };
  } catch (error) {
    console.error('Error duplicating character:', error);
    return { id: null, error: 'Failed to duplicate character' };
  }
}
