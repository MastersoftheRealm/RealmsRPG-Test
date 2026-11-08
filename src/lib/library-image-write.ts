/**
 * Non-admin user-library writes silently drop all image fields (PAGES4-018).
 * Image pickers are admin-only in the UI; the route must not persist injected art.
 */
export function applyUserLibraryImageWritePolicy(body: Record<string, unknown>): string | null {
  delete body.imageUrl;
  delete body.image_url;
  delete body.imageId;
  delete body.image_id;
  return null;
}
