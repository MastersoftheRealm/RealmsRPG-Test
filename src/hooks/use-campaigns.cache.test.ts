import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCampaignCharacterForView } from '@/services/campaign-service';
import { campaignKeys } from './use-campaigns';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('campaignKeys.characterView (TASK-761)', () => {
  it('nests under the campaign detail key', () => {
    expect(campaignKeys.characterView('camp1', 'rm1', 'player1', 'char1')).toEqual([
      ...campaignKeys.detail('camp1'),
      'character-view',
      'rm1',
      'player1',
      'char1',
    ]);
  });

  it('separates viewers and campaigns for the same character', () => {
    const asRm = campaignKeys.characterView('camp1', 'rm1', 'player1', 'char1');
    expect(campaignKeys.characterView('camp1', 'rm2', 'player1', 'char1')).not.toEqual(asRm);
    expect(campaignKeys.characterView('camp2', 'rm1', 'player1', 'char1')).not.toEqual(asRm);
  });

  it('falls back to the anon viewer segment', () => {
    expect(campaignKeys.characterView('camp1', '', 'player1', 'char1')).toContain('anon');
    expect(campaignKeys.characterView('camp1', undefined, 'player1', 'char1')).toContain('anon');
  });
});

describe('getCampaignCharacterForView', () => {
  it('reads the campaign route and splits libraryForView off the character', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'char1',
        name: 'Hero',
        libraryForView: { powers: [], techniques: [], items: [], creatures: [] },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getCampaignCharacterForView('camp1', 'player1', 'char1');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/campaigns/camp1/characters/player1/char1');
    expect(result).toEqual({
      character: { id: 'char1', name: 'Hero' },
      libraryForView: { powers: [], techniques: [], items: [], creatures: [] },
    });
  });
});
