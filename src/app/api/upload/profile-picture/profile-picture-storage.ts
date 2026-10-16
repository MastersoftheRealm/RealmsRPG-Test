export const PROFILE_PICTURES_BUCKET = 'profile-pictures';

/** Object name in `profile-pictures` when `photoUrl` is an uploaded file for `userId`. */
export function profilePictureStorageObjectName(
  photoUrl: string | null | undefined,
  userId: string,
): string | null {
  if (!photoUrl?.trim() || !userId) return null;
  try {
    const url = new URL(photoUrl.split('?')[0] ?? photoUrl);
    const marker = `/${PROFILE_PICTURES_BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    const name = decodeURIComponent(url.pathname.slice(idx + marker.length));
    if (!name.startsWith(`${userId}.`)) return null;
    return name;
  } catch {
    return null;
  }
}
