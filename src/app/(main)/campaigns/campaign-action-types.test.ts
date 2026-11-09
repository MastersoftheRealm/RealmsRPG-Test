import { describe, expect, expectTypeOf, it } from 'vitest';
import { addCharacterToCampaignAction, joinCampaignAction } from './actions';
import { buildRosterFieldsFromCharacterData } from '@/lib/campaign-roster';

describe('PAGES1-010 campaign action inputs', () => {
  it('accepts only invite code and character id on join', () => {
    expectTypeOf(joinCampaignAction).parameters.toEqualTypeOf<
      [{ inviteCode: string; characterId: string }]
    >();
  });

  it('accepts only campaign id and character id when the RM adds a character', () => {
    expectTypeOf(addCharacterToCampaignAction).parameters.toEqualTypeOf<
      [{ campaignId: string; characterId: string }]
    >();
  });

  it('derives roster fields from stored character data, not client display args', () => {
    const fields = buildRosterFieldsFromCharacterData({
      name: 'Stored Name',
      level: 4,
      portrait: 'https://cdn.test/p.png',
      archetype: { type: 'martial' },
      ancestry: { name: 'Elm' },
    });
    expectTypeOf(fields).toEqualTypeOf<{
      characterName: string;
      level: number;
      portrait?: string;
      species?: string;
      archetype: 'Power' | 'Martial' | 'Powered-Martial' | undefined;
    }>();
    expect(fields.characterName).toBe('Stored Name');
    expect(fields.level).toBe(4);
    expect(fields.archetype).toBe('Martial');
    expect(fields.species).toBe('Elm');
  });
});
