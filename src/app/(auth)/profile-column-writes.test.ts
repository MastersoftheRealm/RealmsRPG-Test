import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(process.cwd(), 'sql/86e3jt562-profile-column-writes.sql'),
  'utf8',
);

describe('profile column writes (86e3jt562)', () => {
  it('lets the session client update only display_name and updated_at', () => {
    expect(sql).toMatch(/revoke insert, update on public\.user_profiles from authenticated;/);
    expect(sql).toMatch(
      /grant update \(\s*display_name, updated_at\s*\) on public\.user_profiles to authenticated;/,
    );
    expect(sql).not.toMatch(/grant update \([^)]*username/);
    expect(sql).not.toMatch(/grant update \([^)]*photo_url/);
    expect(sql).not.toMatch(/grant update \([^)]*last_username_change/);
    expect(sql).not.toMatch(/grant update \([^)]*email/);
  });

  it('removes direct writes to the username map', () => {
    expect(sql).toMatch(/revoke insert, update, delete on public\.usernames from authenticated;/);
    expect(sql).toMatch(/drop policy if exists "Users can insert own username"/i);
    expect(sql).toMatch(/drop policy if exists "Users can update own username"/i);
    expect(sql).toMatch(/drop policy if exists "Users can delete own username"/i);
    expect(sql).not.toMatch(/create policy "Users can insert own username"/i);
    expect(sql).not.toMatch(/create policy "Users can update own username"/i);
  });

  it('requires the role flag before a profile picture upload', () => {
    expect(sql).toMatch(/public\.auth_can_upload_profile_picture\(\)/);
    expect(sql).toMatch(/can_upload_profile_picture/);
    const insert = sql.match(
      /create policy "Users can upload own profile picture"[\s\S]*?with check \(([\s\S]*?)\);/i,
    );
    expect(insert?.[1]).toMatch(/auth_can_upload_profile_picture/);
    expect(insert?.[1]).toMatch(/profile-pictures/);
  });
});
