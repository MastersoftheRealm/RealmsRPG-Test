import { describe, expect, it } from 'vitest';
import type { Campaign } from '@/types/campaign';
import type { TrackedCombatant } from '@/types/encounter';
import { DEFAULT_VTT_GRID } from './grid';
import {
  buildCampaignTokenImageUpdates,
  buildMissingTokensFromCombatants,
  buildTokenFromCreature,
  mergeLiveCharacterImagesIntoCampaign,
} from './tokens';

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
  it('defaults campaign-character token images to the current character portrait', () => {
    const campaignWithStalePortrait = {
      ...campaign,
      characters: campaign.characters.map((character) => ({
        ...character,
        portrait: 'https://example.test/old-mara.jpg',
      })),
    } satisfies Campaign;

    const enrichedCampaign = mergeLiveCharacterImagesIntoCampaign(campaignWithStalePortrait, [
      {
        id: 'char-1',
        user_id: 'player-1',
        data: { portrait: 'https://example.test/current-mara.jpg' },
      },
    ]);

    const tokens = buildMissingTokensFromCombatants({
      sceneId: 'scene-1',
      combatants,
      existingTokens: [],
      grid: DEFAULT_VTT_GRID,
      campaign: enrichedCampaign,
    });

    expect(tokens[0]?.imageUrl).toBe('https://example.test/current-mara.jpg');
  });

  it('keeps the roster portrait fallback when the live character row has no image', () => {
    const enrichedCampaign = mergeLiveCharacterImagesIntoCampaign(campaign, [
      {
        id: 'char-1',
        user_id: 'player-1',
        data: { portrait: '' },
      },
    ]);

    const updates = buildCampaignTokenImageUpdates({
      campaign: enrichedCampaign,
      existingTokens: [
        {
          id: 'token-1',
          combatantId: 'c-1',
          sourceType: 'campaign-character',
          sourceId: 'char-1',
          sourceUserId: 'player-1',
          imageUrl: undefined,
        },
      ],
    });

    expect(updates).toEqual([{ id: 'token-1', imageUrl: 'https://example.test/mara.jpg' }]);
  });

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

  it('builds image updates for existing campaign character tokens', () => {
    const updates = buildCampaignTokenImageUpdates({
      campaign,
      existingTokens: [
        {
          id: 'token-1',
          combatantId: 'c-1',
          sourceType: 'campaign-character',
          sourceId: 'char-1',
          sourceUserId: 'player-1',
          imageUrl: undefined,
        },
        {
          id: 'token-2',
          combatantId: 'c-1',
          sourceType: 'campaign-character',
          sourceId: 'char-1',
          sourceUserId: 'player-1',
          imageUrl: 'https://example.test/mara.jpg',
        },
        {
          id: 'token-3',
          combatantId: undefined,
          sourceType: 'manual',
          sourceId: undefined,
          sourceUserId: undefined,
          imageUrl: undefined,
        },
      ],
    });

    expect(updates).toEqual([{ id: 'token-1', imageUrl: 'https://example.test/mara.jpg' }]);
  });

  it('uses linked combatants to update older tokens with missing source refs', () => {
    const updates = buildCampaignTokenImageUpdates({
      campaign,
      combatants,
      existingTokens: [
        {
          id: 'token-1',
          combatantId: 'c-1',
          sourceType: undefined,
          sourceId: undefined,
          sourceUserId: undefined,
          imageUrl: undefined,
        },
      ],
    });

    expect(updates).toEqual([{ id: 'token-1', imageUrl: 'https://example.test/mara.jpg' }]);
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
