/**
 * Owner Library for View
 * =======================
 * Server-only: fetches a user's library (powers, techniques, items) for
 * read-only display when viewing another user's character (public or campaign).
 */

import { prisma } from '@/lib/prisma';

export interface LibraryForView {
  powers: Array<Record<string, unknown>>;
  techniques: Array<Record<string, unknown>>;
  items: Array<Record<string, unknown>>;
}

function rowToItem(row: { id: string; data: unknown }): Record<string, unknown> {
  const d = (row.data as Record<string, unknown>) || {};
  return {
    id: row.id,
    docId: row.id,
    ...d,
  };
}

/**
 * Fetch a user's library items for display when viewing their character.
 * Used by GET /api/characters/[id] and GET /api/campaigns/[id]/characters/[userId]/[characterId].
 */
export async function getOwnerLibraryForView(ownerUserId: string): Promise<LibraryForView> {
  const [powerRows, techniqueRows, itemRows] = await Promise.all([
    prisma.userPower.findMany({
      where: { userId: ownerUserId },
      select: { id: true, data: true },
    }),
    prisma.userTechnique.findMany({
      where: { userId: ownerUserId },
      select: { id: true, data: true },
    }),
    prisma.userItem.findMany({
      where: { userId: ownerUserId },
      select: { id: true, data: true },
    }),
  ]);

  return {
    powers: powerRows.map(rowToItem),
    techniques: techniqueRows.map(rowToItem),
    items: itemRows.map(rowToItem),
  };
}
