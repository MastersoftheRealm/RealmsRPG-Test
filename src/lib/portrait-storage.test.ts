import { describe, expect, it } from 'vitest';
import { characterPortraitStoragePaths, portraitUrlUsesCharacterStorage } from './portrait-storage';

const USER = 'owner-user';
const CHAR = '11111111-1111-1111-1111-111111111111';

describe('character portrait storage paths (86e3jvzt6)', () => {
  it('includes the png object the sheet uploads', () => {
    expect(characterPortraitStoragePaths(USER, CHAR)).toContain(`${USER}/${CHAR}.png`);
  });

  it('treats only this character’s storage URL as still referenced', () => {
    const stored = `https://cdn.test/storage/v1/object/public/portraits/${USER}/${CHAR}.png`;
    expect(portraitUrlUsesCharacterStorage(stored, USER, CHAR)).toBe(true);
    expect(portraitUrlUsesCharacterStorage(`${stored}?t=1`, USER, CHAR)).toBe(true);
    expect(
      portraitUrlUsesCharacterStorage(
        'https://cdn.test/storage/v1/object/public/realms-images/library.png',
        USER,
        CHAR,
      ),
    ).toBe(false);
    expect(portraitUrlUsesCharacterStorage('', USER, CHAR)).toBe(false);
  });
});
