/**
 * Character list columns — extract list/index fields from character data for DB columns.
 * Used when creating/updating characters so list views can use columns instead of JSONB.
 */

import { resolveArchetypeDisplayName } from '@/lib/game/archetype-display';

export function getCharacterListColumns(
  data: Record<string, unknown>,
  options?: { archetypeNameById?: Map<string, string> }
): {
  name: string;
  level: number;
  archetype_name: string | null;
  ancestry_name: string | null;
  status: string | null;
  visibility: string | null;
} {
  const archName = resolveArchetypeDisplayName(
    {
      archetypePathId: data.archetypePathId as string | undefined,
      archetype: data.archetype as { id?: string; name?: string; type?: string } | undefined,
    },
    options?.archetypeNameById
  );
  const ancestry = data.ancestry as { name?: string } | undefined;
  return {
    name: (data.name as string) ?? 'Unnamed',
    level: typeof data.level === 'number' ? data.level : 1,
    archetype_name: archName ?? null,
    ancestry_name: ancestry?.name ?? (data.species as string) ?? null,
    status: (data.status as string) ?? null,
    visibility: (data.visibility as string) ?? 'private',
  };
}
