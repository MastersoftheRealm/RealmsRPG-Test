import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(process.cwd(), 'sql/86e3jryyt-campaign-roster-members-only.sql'),
  'utf8',
);

describe('campaign roster writes (86e3jryyt)', () => {
  it('rejects a signed-in owner adding another user character', () => {
    expect(sql).toContain("RAISE EXCEPTION 'roster can only add your own characters'");
    expect(sql).toContain('IF actor IS NOT NULL AND new_user IS DISTINCT FROM actor THEN');
    expect(sql).toContain('BEFORE INSERT OR UPDATE OF characters ON public.campaigns');
  });

  it('stops a leftover roster entry from granting a campaign read after membership is gone', () => {
    expect(sql).toContain("RAISE EXCEPTION 'roster user has not joined this campaign'");
    expect(sql).toContain('private.campaign_roster_user_joined(');
    expect(sql).toContain('private.auth_is_campaign_participant(c.id)');
    expect(sql).toContain('WHEN OLD.characters IS NULL');
    expect(sql).not.toMatch(/CREATE POLICY campaign_members_/);
    expect(sql).not.toMatch(/DROP POLICY[^;]*campaign_members/);
  });
});
