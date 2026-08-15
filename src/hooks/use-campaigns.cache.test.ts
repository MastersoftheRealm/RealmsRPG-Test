import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getCampaignCharacterForEncounter,
  getCampaignCharacterForView,
} from '@/services/campaign-service';
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

describe('campaignKeys.characterEncounter (TASK-762)', () => {
  it('nests under the campaign detail key with the encounter scope segment', () => {
    expect(campaignKeys.characterEncounter('camp1', 'rm1', 'player1', 'char1')).toEqual([
      ...campaignKeys.detail('camp1'),
      'character-encounter',
      'rm1',
      'player1',
      'char1',
    ]);
  });

  it('is distinct from the RM character-view key', () => {
    expect(campaignKeys.characterEncounter('camp1', 'rm1', 'player1', 'char1')).not.toEqual(
      campaignKeys.characterView('camp1', 'rm1', 'player1', 'char1')
    );
  });

  it('separates viewers and campaigns for the same character', () => {
    const asRm = campaignKeys.characterEncounter('camp1', 'rm1', 'player1', 'char1');
    expect(campaignKeys.characterEncounter('camp1', 'rm2', 'player1', 'char1')).not.toEqual(asRm);
    expect(campaignKeys.characterEncounter('camp2', 'rm1', 'player1', 'char1')).not.toEqual(asRm);
  });

  it('falls back to the anon viewer segment', () => {
    expect(campaignKeys.characterEncounter('camp1', '', 'player1', 'char1')).toContain('anon');
    expect(campaignKeys.characterEncounter('camp1', undefined, 'player1', 'char1')).toContain('anon');
  });
});

describe('getCampaignCharacterForEncounter', () => {
  it('reads the campaign route with ?scope=encounter and does not hit the RM-view URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ currentHealth: 12, health: { current: 12, max: 20 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getCampaignCharacterForEncounter('camp1', 'player1', 'char1');

    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/campaigns/camp1/characters/player1/char1?scope=encounter'
    );
    expect(fetchMock.mock.calls[0][0]).not.toBe('/api/campaigns/camp1/characters/player1/char1');
    expect(result).toEqual({ currentHealth: 12, health: { current: 12, max: 20 } });
  });
});
