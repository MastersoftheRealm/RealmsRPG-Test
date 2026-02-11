/**
 * Character Server (Prisma)
 * =========================
 * Server-side character fetching for SSR.
 */

import { prisma } from '@/lib/prisma';

export async function getUserCharacters(userId: string) {
  const rows = await prisma.character.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map((r) => {
    const d = r.data as Record<string, unknown>;
    return {
      id: r.id,
      name: (d.name as string) || 'Unnamed',
      level: (d.level as number) || 1,
      portrait: d.portrait,
      archetypeName: (d.archetype as { name?: string; type?: string })?.name
        || ((d.archetype as { type?: string })?.type?.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')),
      ancestryName: (d.ancestry as { name?: string })?.name || (d.species as string),
      status: d.status,
      updatedAt: r.updatedAt,
    };
  });
}

export async function getCharacterById(userId: string, characterId: string) {
  const row = await prisma.character.findFirst({
    where: { id: characterId, userId },
  });
  if (!row) return null;
  const d = row.data as Record<string, unknown>;
  return {
    id: row.id,
    name: (d.name as string) || 'Unnamed',
    level: (d.level as number) || 1,
    ...d,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
