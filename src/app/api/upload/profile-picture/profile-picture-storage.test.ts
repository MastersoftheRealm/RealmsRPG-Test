import { describe, expect, it } from 'vitest';
import { profilePictureStorageObjectName } from './profile-picture-storage';

describe('profilePictureStorageObjectName', () => {
  const uid = 'abc-123';

  it('returns the object name for a public profile-pictures URL', () => {
    expect(
      profilePictureStorageObjectName(
        `https://cdn.example/storage/v1/object/public/profile-pictures/${uid}.png`,
        uid,
      ),
    ).toBe(`${uid}.png`);
  });

  it('ignores library portrait URLs', () => {
    expect(
      profilePictureStorageObjectName('https://cdn.example/codex-art/species/wolf.png', uid),
    ).toBeNull();
  });

  it('rejects another user’s uploaded object', () => {
    expect(
      profilePictureStorageObjectName(
        'https://cdn.example/storage/v1/object/public/profile-pictures/other-user.png',
        uid,
      ),
    ).toBeNull();
  });
});
