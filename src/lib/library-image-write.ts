const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const IMAGE_WRITE_KEYS = ['imageId', 'image_id', 'imageUrl', 'image_url'] as const;

function bodyHasImageWriteFields(body: Record<string, unknown>): boolean {
  return IMAGE_WRITE_KEYS.some((key) => body[key] !== undefined);
}

/** Official catalog writes require admin when the payload touches image columns. */
export function officialImageFieldAuthzError(
  body: Record<string, unknown>,
  isAdmin: boolean,
): string | null {
  if (isAdmin) return null;
  if (!bodyHasImageWriteFields(body)) return null;
  return 'Admin only';
}

/**
 * Official admin catalog writes: same bank image_id rules as user library, but
 * null imageUrl after strip so updates clear the denormalized cache (GET re-fills from bank).
 */
export function applyOfficialAdminImageWritePolicy(body: Record<string, unknown>): string | null {
  const hadImageFields = bodyHasImageWriteFields(body);
  const imageError = applyUserLibraryImageWritePolicy(body);
  if (imageError) return imageError;
  if (hadImageFields) {
    body.imageUrl = null;
    delete body.image_url;
  }
  return null;
}

/** Non-admin library writes may set bank image_id only; direct URL injection is stripped. */
export function applyUserLibraryImageWritePolicy(body: Record<string, unknown>): string | null {
  delete body.imageUrl;
  delete body.image_url;

  const rawId = body.imageId !== undefined ? body.imageId : body.image_id;
  if (rawId === undefined) return null;
  if (rawId === null) {
    body.imageId = null;
    delete body.image_id;
    return null;
  }
  if (typeof rawId !== 'string' || !UUID_RE.test(rawId.trim())) {
    return 'Invalid image reference';
  }
  body.imageId = rawId.trim();
  delete body.image_id;
  return null;
}
