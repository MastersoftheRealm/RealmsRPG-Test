/**
 * Game Data Service
 * ==================
 * Game data (archetypes) — reads from Prisma via API.
 *
 * NOTE: Legacy functions for skills, feats, ancestries, generic data
 * removed (2026-02-13 audit). Use Codex hooks from use-codex.ts instead.
 * Only archetype functions remain until AdminArchetypesTab is migrated.
 *
 * The manual cache has been removed — React Query handles caching.
 */

import type { Archetype } from '@/types';
import { fetchCodex } from '@/lib/api-client';

export async function getArchetypes(): Promise<Archetype[]> {
  const data = await fetchCodex();
  return (data.archetypes ?? []).map((a: Record<string, unknown>) => ({ ...a, id: a.id })) as Archetype[];
}

export async function getArchetype(id: string): Promise<Archetype | null> {
  const all = await getArchetypes();
  return all.find((a) => a.id === id) ?? null;
}
