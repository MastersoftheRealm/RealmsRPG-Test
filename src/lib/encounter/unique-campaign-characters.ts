type DuplicateScope = 'combatants' | 'participants';

export type DuplicateCampaignCharacterReport = Partial<Record<DuplicateScope, string[]>>;

interface EncounterCampaignCharacterLists {
  combatants?: readonly unknown[];
  skillEncounter?: { participants?: readonly unknown[] } | null;
}

function readCampaignCharacterId(entry: unknown): string | null {
  if (!entry || typeof entry !== 'object') return null;
  const record = entry as { sourceType?: unknown; sourceId?: unknown };
  if (record.sourceType !== 'campaign-character') return null;
  return typeof record.sourceId === 'string' && record.sourceId.trim() ? record.sourceId.trim() : null;
}

function findDuplicateIds(entries: readonly unknown[] | undefined): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const entry of entries ?? []) {
    const characterId = readCampaignCharacterId(entry);
    if (!characterId) continue;
    if (seen.has(characterId)) {
      duplicates.add(characterId);
    } else {
      seen.add(characterId);
    }
  }

  return [...duplicates];
}

export function getCampaignCharacterIds(entries: readonly unknown[] | undefined): Set<string> {
  const ids = new Set<string>();
  for (const entry of entries ?? []) {
    const characterId = readCampaignCharacterId(entry);
    if (characterId) ids.add(characterId);
  }
  return ids;
}

export function filterDuplicateCampaignCharacterEntries<T>(
  entries: readonly T[],
  existingEntries: readonly unknown[] | undefined = []
): T[] {
  const seen = getCampaignCharacterIds(existingEntries);
  const filtered: T[] = [];

  for (const entry of entries) {
    const characterId = readCampaignCharacterId(entry);
    if (characterId && seen.has(characterId)) continue;
    if (characterId) seen.add(characterId);
    filtered.push(entry);
  }

  return filtered;
}

export function getDuplicateCampaignCharactersByScope(encounter: EncounterCampaignCharacterLists | null | undefined): DuplicateCampaignCharacterReport {
  const report: DuplicateCampaignCharacterReport = {};
  const combatants = findDuplicateIds(encounter?.combatants);
  const participants = findDuplicateIds(encounter?.skillEncounter?.participants);

  if (combatants.length > 0) report.combatants = combatants;
  if (participants.length > 0) report.participants = participants;

  return report;
}

export function hasDuplicateCampaignCharacters(encounter: EncounterCampaignCharacterLists | null | undefined): boolean {
  const report = getDuplicateCampaignCharactersByScope(encounter);
  return Boolean(report.combatants?.length || report.participants?.length);
}

export function formatDuplicateCampaignCharacterMessage(report: DuplicateCampaignCharacterReport): string {
  const scopes: string[] = [];
  if (report.combatants?.length) scopes.push('combatants');
  if (report.participants?.length) scopes.push('skill participants');

  if (scopes.length === 0) return '';
  return `Each campaign character can only be added once to encounter ${scopes.join(' and ')}.`;
}

export function assertNoDuplicateCampaignCharacters(encounter: EncounterCampaignCharacterLists | null | undefined): void {
  const report = getDuplicateCampaignCharactersByScope(encounter);
  const message = formatDuplicateCampaignCharacterMessage(report);
  if (message) throw new Error(message);
}
