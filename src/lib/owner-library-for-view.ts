/**
 * Owner Library for View
 * =======================
 * Server-only: fetches a user's library (powers, techniques, items) for
 * read-only display when viewing another user's character (public or campaign).
 * Uses columnar user_* tables (same shape as API).
 */

import { prisma } from '@/lib/prisma';
import { rowToItem } from '@/lib/library-columnar';

export interface LibraryForView {
  powers: Array<Record<string, unknown>>;
  techniques: Array<Record<string, unknown>>;
  items: Array<Record<string, unknown>>;
}

/**
 * Fetch a user's library items for display when viewing their character.
 * Used by GET /api/characters/[id] and GET /api/campaigns/[id]/characters/[userId]/[characterId].
 */
export async function getOwnerLibraryForView(ownerUserId: string): Promise<LibraryForView> {
  const [powerRows, techniqueRows, itemRows] = await Promise.all([
    prisma.userPower.findMany({
      where: { userId: ownerUserId },
    }),
    prisma.userTechnique.findMany({
      where: { userId: ownerUserId },
    }),
    prisma.userItem.findMany({
      where: { userId: ownerUserId },
    }),
  ]);

  return {
    powers: powerRows.map((r) => rowToItem('powers', r as unknown as Record<string, unknown>, 'user')),
    techniques: techniqueRows.map((r) => rowToItem('techniques', r as unknown as Record<string, unknown>, 'user')),
    items: itemRows.map((r) => rowToItem('items', r as unknown as Record<string, unknown>, 'user')),
  };
}
