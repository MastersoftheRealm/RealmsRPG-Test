const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
