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
