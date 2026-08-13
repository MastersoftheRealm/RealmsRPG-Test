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

/**
 * Wave 1 made `characters.visibility` the SELECT/list authority.
 * GET must read the column first; blob is only a fallback if the column is missing.
 */
export function resolveCharacterVisibility(row: {
  visibility?: string | null;
  data?: unknown;
}): CharacterVisibility {
  const fromColumn = asVisibility(row.visibility);
  if (fromColumn) return fromColumn;
  const blob = row.data && typeof row.data === 'object' ? (row.data as Record<string, unknown>).visibility : undefined;
  return asVisibility(blob) ?? 'private';
}

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
