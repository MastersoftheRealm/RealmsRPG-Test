/**
 * Character list columns — extract list/index fields from character data for DB columns.
 * Used when creating/updating characters so list views can use columns instead of JSONB.
 */

import { resolveArchetypeDisplayName } from '@/lib/game/archetype-display';
import type { CharacterVisibility } from '@/types';

const VISIBILITY_VALUES: readonly CharacterVisibility[] = ['private', 'campaign', 'public'];

function asVisibility(value: unknown): CharacterVisibility | null {
  return typeof value === 'string' && (VISIBILITY_VALUES as readonly string[]).includes(value)
    ? (value as CharacterVisibility)
    : null;
}

/** `characters.visibility` is the sole list/read authority after ADR-0030. */
export function resolveCharacterVisibility(row: {
  visibility?: string | null | undefined;
}): CharacterVisibility {
  return asVisibility(row.visibility) ?? 'private';
}

export function getCharacterListColumns(
  data: Record<string, unknown>,
  options?: { archetypeNameById?: Map<string, string> | undefined },
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
      archetype: data.archetype as
        | { id?: string | undefined; name?: string | undefined; type?: string | undefined }
        | undefined,
    },
    options?.archetypeNameById,
  );
  const ancestry = data.ancestry as { name?: string | undefined } | undefined;
  return {
    name: (data.name as string) ?? 'Unnamed',
    level: typeof data.level === 'number' ? data.level : 1,
    archetype_name: archName ?? null,
    ancestry_name: ancestry?.name ?? (data.species as string) ?? null,
    status: (data.status as string) ?? null,
    visibility: (data.visibility as string) ?? 'private',
  };
}
