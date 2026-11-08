/**
 * Campaign server actions — SEC-06 roster fields must come from stored character data,
 * not client-supplied display fields (PAGES1-010).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase } from '@/lib/codex/fake-supabase';
import type { CampaignCharacter } from '@/types/campaign';

vi.mock('@/lib/supabase/session', () => ({
  requireAuth: vi.fn(async () => ({ uid: 'owner-uid' })),
}));

let currentDb: FakeSupabase;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => currentDb),
  createServiceRoleClient: vi.fn(() => currentDb),
}));

const CAMPAIGN_ID = 'camp-1';
const CHARACTER_ID = 'char-stored';

function seedCampaignOwnerScenario(): FakeSupabase {
  currentDb = new FakeSupabase({
    campaigns: [
      {
        id: CAMPAIGN_ID,
        owner_id: 'owner-uid',
        characters: [],
      },
    ],
    characters: [
      {
        id: CHARACTER_ID,
        user_id: 'owner-uid',
        data: {
          name: 'Stored Authority Name',
          level: 7,
          portrait: 'stored-portrait.png',
          ancestry: { name: 'Stored Species' },
          archetype: { type: 'martial' },
          visibility: 'private',
        },
      },
    ],
    user_profiles: [{ id: 'owner-uid', username: 'rm-user' }],
    campaign_members: [],
  });
  return currentDb;
}

describe('addCharacterToCampaignAction', () => {
  beforeEach(() => {
    seedCampaignOwnerScenario();
  });

  it('writes roster name and level from stored character data, not client display fields', async () => {
    const { addCharacterToCampaignAction } = await import('./actions');

    const forgedCallerPayload = {
      campaignId: CAMPAIGN_ID,
      characterId: CHARACTER_ID,
      characterName: 'Client Forged Name',
      level: 99,
    } as Parameters<typeof addCharacterToCampaignAction>[0];

    const result = await addCharacterToCampaignAction(forgedCallerPayload);

    expect(result.success).toBe(true);

    const campaignRow = currentDb.tables.campaigns?.[0];
    expect(campaignRow).toBeDefined();
    const roster = campaignRow!.characters as CampaignCharacter[];
    expect(roster).toHaveLength(1);
    const entry = roster[0]!;
    expect(entry.characterName).toBe('Stored Authority Name');
    expect(entry.level).toBe(7);
    expect(entry.species).toBe('Stored Species');
    expect(entry.archetype).toBe('Martial');
    expect(entry.portrait).toBe('stored-portrait.png');
  });
});
