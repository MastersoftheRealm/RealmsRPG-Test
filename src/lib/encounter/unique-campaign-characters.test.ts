import { describe, expect, it } from 'vitest';
import {
  filterDuplicateCampaignCharacterEntries,
  getDuplicateCampaignCharactersByScope,
  hasDuplicateCampaignCharacters,
} from './unique-campaign-characters';
import type { Encounter, SkillParticipant, TrackedCombatant } from '@/types/encounter';

function characterEntry(id: string): TrackedCombatant {
  return {
    id: `combatant-${id}`,
    name: id,
    initiative: 0,
    acuity: 0,
    maxHealth: 20,
    currentHealth: 20,
    maxEnergy: 10,
    currentEnergy: 10,
    armor: 0,
    evasion: 10,
    ap: 4,
    conditions: [],
    notes: '',
    combatantType: 'ally',
    isAlly: true,
    isSurprised: false,
    sourceType: 'campaign-character',
    sourceId: id,
  };
}

describe('unique campaign characters in encounters', () => {
  it('filters incoming campaign-character duplicates while keeping manual and creature entries', () => {
    const incoming: TrackedCombatant[] = [
      characterEntry('char-1'),
      characterEntry('char-2'),
      { ...characterEntry('char-1'), id: 'duplicate-char-1' },
      { ...characterEntry('creature-1'), sourceType: 'creature-library' },
      { ...characterEntry('manual-1'), sourceType: 'manual', sourceId: undefined },
    ];

    const filtered = filterDuplicateCampaignCharacterEntries(incoming, [characterEntry('char-2')]);

    expect(filtered.map((entry) => entry.id)).toEqual([
      'combatant-char-1',
      'combatant-creature-1',
      'combatant-manual-1',
    ]);
  });

  it('reports duplicate campaign characters separately for combatants and skill participants', () => {
    const participant = (id: string): SkillParticipant => ({
      id: `participant-${id}`,
      name: id,
      hasRolled: false,
      sourceType: 'campaign-character',
      sourceId: id,
    });
    const encounter: Partial<Encounter> = {
      combatants: [characterEntry('char-1'), characterEntry('char-1')],
      skillEncounter: {
        difficultyScore: 10,
        participants: [participant('char-2'), participant('char-3'), participant('char-2')],
        currentSuccesses: 0,
        currentFailures: 0,
      },
    };

    expect(hasDuplicateCampaignCharacters(encounter)).toBe(true);
    expect(getDuplicateCampaignCharactersByScope(encounter)).toEqual({
      combatants: ['char-1'],
      participants: ['char-2'],
    });
  });
});
