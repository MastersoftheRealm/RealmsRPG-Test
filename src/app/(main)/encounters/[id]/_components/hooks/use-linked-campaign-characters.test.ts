/** @vitest-environment happy-dom */
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Campaign } from '@/types/campaign';
import { useLinkedCampaignCharacters } from './use-linked-campaign-characters';

describe('useLinkedCampaignCharacters', () => {
  const campaigns: Campaign[] = [
    {
      id: 'camp-1',
      name: 'Alpha',
      characters: [
        { characterId: 'char-a', name: 'A' },
        { characterId: 'char-b', name: 'B' },
      ],
    } as unknown as Campaign,
  ];

  it('lists campaign characters not already on the roster', () => {
    const { result } = renderHook(() =>
      useLinkedCampaignCharacters({
        campaignId: 'camp-1',
        campaignsFull: campaigns,
        rosterEntries: [{ sourceType: 'campaign-character', sourceId: 'char-a' }],
      }),
    );
    expect(result.current.linkedCampaign?.id).toBe('camp-1');
    expect(result.current.availableCampaignCharacterCount).toBe(1);
    expect(result.current.availableCampaignCharacters[0]?.characterId).toBe('char-b');
  });

  it('returns empty availability when every linked character is on the roster', () => {
    const { result } = renderHook(() =>
      useLinkedCampaignCharacters({
        campaignId: 'camp-1',
        campaignsFull: campaigns,
        rosterEntries: [
          { sourceType: 'campaign-character', sourceId: 'char-a' },
          { sourceType: 'campaign-character', sourceId: 'char-b' },
        ],
      }),
    );
    expect(result.current.availableCampaignCharacterCount).toBe(0);
  });
});
