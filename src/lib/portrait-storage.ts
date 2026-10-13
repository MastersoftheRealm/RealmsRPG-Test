/**
 * Character portrait objects live at portraits/{userId}/{characterId}.{ext}.
 * Upload accepts the image types in validate-image; jpeg may be stored as jpg or jpeg.
 */

const PORTRAIT_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] as const;

export function characterPortraitStoragePaths(userId: string, characterId: string): string[] {
  return PORTRAIT_EXTENSIONS.map((ext) => `${userId}/${characterId}.${ext}`);
}

/** True when the saved portrait URL is this character's own storage object. */
export function portraitUrlUsesCharacterStorage(
  portrait: string,
  userId: string,
  characterId: string,
): boolean {
  const trimmed = portrait.trim();
  if (!trimmed) return false;
  let pathname = trimmed;
  try {
    pathname = new URL(trimmed, 'https://portrait.local').pathname;
  } catch {
    return false;
  }
  return characterPortraitStoragePaths(userId, characterId).some((objectPath) =>
    pathname.endsWith(`/${objectPath}`),
  );
}
