/**
 * Campaign roster JSON normalization
 * ==================================
 * `campaigns.characters` is JSONB; entries may use camelCase or legacy snake_case keys.
 */

import type { CampaignCharacter } from '@/types/campaign';

export function normalizeCampaignRosterCharacters(raw: unknown): CampaignCharacter[] {
  let arr: unknown[] = [];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      arr = Array.isArray(parsed) ? parsed : [];
    } catch {
      arr = [];
    }
  }

  const out: CampaignCharacter[] = [];
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;
    const userId = String(e.userId ?? e.user_id ?? '').trim();
    const characterId = String(e.characterId ?? e.character_id ?? '').trim();
    if (!userId || !characterId) continue;
    out.push({
      userId,
      characterId,
      characterName: String(e.characterName ?? e.character_name ?? 'Character'),
      level:
        typeof e.level === 'number' && !Number.isNaN(e.level)
          ? e.level
          : Number(e.level) || 1,
      portrait: typeof e.portrait === 'string' ? e.portrait : undefined,
      species: typeof e.species === 'string' ? e.species : undefined,
      archetype: e.archetype as CampaignCharacter['archetype'],
      ownerUsername:
        typeof e.ownerUsername === 'string'
          ? e.ownerUsername
          : typeof e.owner_username === 'string'
            ? e.owner_username
            : undefined,
    });
  }
  return out;
}

/** Map a character archetype `type` to the roster display label. */
export function archetypeDisplayNameFromType(
  archetypeType?: string
): CampaignCharacter['archetype'] {
  if (!archetypeType) return undefined;
  const lower = archetypeType.toLowerCase();
  if (lower === 'power') return 'Power';
  if (lower === 'martial') return 'Martial';
  if (lower === 'powered-martial' || lower === 'poweredmartial') return 'Powered-Martial';
  return undefined;
}

/**
 * SEC-06: derive the campaign roster fields (name/level/species/archetype/portrait)
 * from the authoritative character `data` JSONB rather than trusting client input,
 * so a player cannot misrepresent their character to other campaign members.
 */
export function buildRosterFieldsFromCharacterData(charData: Record<string, unknown>): {
  characterName: string;
  level: number;
  portrait?: string;
  species?: string;
  archetype: CampaignCharacter['archetype'];
} {
  const archetype = charData.archetype as { type?: string } | undefined;
  const ancestry = charData.ancestry as { name?: string } | undefined;
  const speciesStr =
    (typeof ancestry?.name === 'string' && ancestry.name.trim()) ||
    (typeof charData.species === 'string' ? (charData.species as string).trim() : '') ||
    undefined;
  return {
    characterName: String((charData.name as string) ?? 'Character').trim() || 'Character',
    level: typeof charData.level === 'number' ? charData.level : Number(charData.level) || 1,
    portrait: typeof charData.portrait === 'string' ? (charData.portrait as string) : undefined,
    species: speciesStr || undefined,
    archetype: archetypeDisplayNameFromType(archetype?.type),
  };
}

export function isCharacterOnCampaignRoster(
  rosterRaw: unknown,
  userId: string,
  characterId: string
): boolean {
  const u = userId.trim();
  const c = characterId.trim();
  return normalizeCampaignRosterCharacters(rosterRaw).some(
    (x) => x.userId === u && x.characterId === c
  );
}
