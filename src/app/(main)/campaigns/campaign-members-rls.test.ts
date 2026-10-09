import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(process.cwd(), 'sql/86e3jryyr-campaign-members-insert-owner-self.sql'),
  'utf8',
);

/** Same rule as campaign_members_insert_owner_self WITH CHECK. */
function authenticatedMayInsertCampaignMember(input: {
  callerOwnsCampaign: boolean;
  rowUserId: string;
  authUid: string;
}): boolean {
  return input.callerOwnsCampaign && input.rowUserId === input.authUid;
}

function insertWithCheck(source: string): string {
  const match = source.match(
    /CREATE POLICY campaign_members_insert_owner_self[\s\S]*?WITH CHECK \(([\s\S]*?)\);/,
  );
  if (!match?.[1]) {
    throw new Error('campaign_members_insert_owner_self WITH CHECK is missing');
  }
  return match[1];
}

describe('campaign_members insert (86e3jryyr)', () => {
  it('rejects a signed-in user adding themselves to a campaign they do not own', () => {
    expect(
      authenticatedMayInsertCampaignMember({
        callerOwnsCampaign: false,
        rowUserId: 'player',
        authUid: 'player',
      }),
    ).toBe(false);

    const check = insertWithCheck(sql);
    expect(check).toContain('private.auth_is_campaign_owner(campaign_id)');
    expect(check).toMatch(/user_id = \(\(SELECT auth\.uid\(\)\)::text\)/);
    expect(check).not.toMatch(/\bOR\b/);
  });

  it('rejects an owner inserting a different user id', () => {
    expect(
      authenticatedMayInsertCampaignMember({
        callerOwnsCampaign: true,
        rowUserId: 'other-player',
        authUid: 'realm-master',
      }),
    ).toBe(false);
  });

  it('allows the owner to insert their own membership', () => {
    expect(
      authenticatedMayInsertCampaignMember({
        callerOwnsCampaign: true,
        rowUserId: 'realm-master',
        authUid: 'realm-master',
      }),
    ).toBe(true);
  });

  it('drops the update policy so a membership row cannot move to another campaign', () => {
    expect(sql).toMatch(
      /DROP POLICY IF EXISTS campaign_members_update_self\s+ON public\.campaign_members;/,
    );
    expect(sql).not.toMatch(/CREATE POLICY campaign_members_update_self/);
    expect(sql).not.toMatch(/CREATE POLICY campaign_members_select_participants/);
    expect(sql).not.toMatch(/CREATE POLICY campaign_members_delete_owner_or_self/);
  });
});
