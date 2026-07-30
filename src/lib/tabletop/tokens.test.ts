import { describe, expect, it } from 'vitest';
import type { Campaign } from '@/types/campaign';
import type { TrackedCombatant } from '@/types/encounter';
import { DEFAULT_VTT_GRID } from './grid';
import { buildMissingTokensFromCombatants, buildTokenFromCreature } from './tokens';

const campaign = {
  id: 'campaign-1',
  name: 'Night Watch',
  ownerId: 'rm',
  inviteCode: 'ABCDEFGH',
  memberIds: [],
  characters: [
    {
      userId: 'player-1',
      characterId: 'char-1',
      characterName: 'Mara',
      level: 1,
      portrait: 'https://example.test/mara.jpg',
    },
  ],
} satisfies Campaign;

const combatants: TrackedCombatant[] = [
  {
    id: 'c-1',
    name: 'Mara',
    initiative: 12,
    acuity: 2,
    maxHealth: 20,
    currentHealth: 18,
    maxEnergy: 10,
    currentEnergy: 7,
    armor: 2,
    evasion: 13,
    ap: 4,
    conditions: [],
    notes: '',
    combatantType: 'ally',
    isAlly: true,
    isSurprised: false,
    sourceType: 'campaign-character',
    sourceId: 'char-1',
    sourceUserId: 'player-1',
  },
  {
    id: 'c-2',
    name: 'Ash Wraith',
    initiative: 10,
    acuity: 1,
    maxHealth: 12,
    currentHealth: 12,
    maxEnergy: 0,
    currentEnergy: 0,
    armor: 1,
    evasion: 11,
    ap: 4,
    conditions: [],
    notes: '',
    combatantType: 'enemy',
    isAlly: false,
    isSurprised: false,
    sourceType: 'manual',
  },
];

describe('tabletop token seeding', () => {
  it('creates only missing combatant tokens and copies campaign portraits', () => {
    const tokens = buildMissingTokensFromCombatants({
      sceneId: 'scene-1',
      combatants,
      existingTokens: [{ combatantId: 'c-2' }],
      grid: DEFAULT_VTT_GRID,
      campaign,
    });

    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.combatantId).toBe('c-1');
    expect(tokens[0]?.imageUrl).toBe('https://example.test/mara.jpg');
    expect(tokens[0]?.metadata.currentHealth).toBe(18);
  });

  it('creates hidden enemy tokens from library creatures with resource metadata', () => {
    const token = buildTokenFromCreature({
      sceneId: 'scene-1',
      sourceId: 'creature-1',
      index: 0,
      grid: DEFAULT_VTT_GRID,
      creature: {
        id: 'creature-1',
        docId: 'creature-1',
        name: 'Ash Wraith',
        description: 'A smoke-thin undead predator.',
        level: 2,
        type: 'undead',
        size: 'Large',
        hitPoints: 10,
        energyPoints: 4,
        abilities: { vitality: 2, agility: 3, acuity: 1 },
      },
    });

    expect(token.combatantType).toBe('enemy');
    expect(token.sourceType).toBe('creature-library');
    expect(token.sourceId).toBe('creature-1');
    expect(token.visible).toBe(false);
    expect(token.size).toBeGreaterThan(DEFAULT_VTT_GRID.cellSize);
    expect(token.metadata).toMatchObject({
      currentHealth: 14,
      maxHealth: 14,
      currentEnergy: 10,
      maxEnergy: 10,
      evasion: 13,
      creatureLevel: 2,
      creatureType: 'undead',
      creatureSize: 'Large',
    });
  });
});
