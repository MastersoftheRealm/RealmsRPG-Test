import { describe, expect, it } from 'vitest';
import { isUserCampaignParticipant } from '@/lib/campaign-roster';

describe('isUserCampaignParticipant', () => {
  it('accepts the campaign owner and listed members', () => {
    expect(isUserCampaignParticipant('owner-1', 'owner-1', [])).toBe(true);
    expect(isUserCampaignParticipant('player-1', 'owner-1', ['player-1', 'other'])).toBe(true);
  });

  it('rejects a stale roster user who is not a member', () => {
    expect(isUserCampaignParticipant('former-player', 'owner-1', ['other'])).toBe(false);
  });
});
