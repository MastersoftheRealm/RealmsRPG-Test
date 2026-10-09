import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(process.cwd(), 'sql/86e3jryyr-campaign-members-insert-owner-self.sql'),
  'utf8',
);

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
  it('lets an authenticated user insert only their own row on a campaign they own', () => {
    const check = insertWithCheck(sql);
    expect(check).toContain('private.auth_is_campaign_owner(campaign_id)');
    expect(check).toMatch(/user_id = \(\(SELECT auth\.uid\(\)\)::text\)/);
    expect(check).toMatch(/auth_is_campaign_owner\(campaign_id\)\s+AND\s+user_id/);
    expect(check).not.toMatch(/\bOR\b/);
    expect(sql).toMatch(
      /DROP POLICY IF EXISTS campaign_members_insert_owner_or_self\s+ON public\.campaign_members;/,
    );
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
