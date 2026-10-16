import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(
  path.join(process.cwd(), 'sql/86e3jtcdk-profile-picture-delete-policy-proposed.sql'),
  'utf8',
);

describe('profile picture delete storage policy (86e3jtcdk proposed)', () => {
  it('gates storage DELETE on can_upload_profile_picture', () => {
    expect(sql).toMatch(/PROPOSED/i);
    expect(sql).toMatch(/auth_can_upload_profile_picture/);
    const deletePolicy = sql.match(
      /create policy "Users can delete own profile picture"[\s\S]*?using \(([\s\S]*?)\);/i,
    );
    expect(deletePolicy?.[1]).toMatch(/auth_can_upload_profile_picture/);
    expect(deletePolicy?.[1]).toMatch(/profile-pictures/);
  });
});
