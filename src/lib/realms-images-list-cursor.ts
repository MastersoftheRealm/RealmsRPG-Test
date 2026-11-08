/** Opaque cursor for GET /api/images offset paging (base64url-encoded offset). */

export function encodeRealmsImagesListCursor(offset: number): string {
  return Buffer.from(String(offset), 'utf8').toString('base64url');
}

export function decodeRealmsImagesListCursor(cursor: string): number | null {
  try {
    const offset = Number.parseInt(Buffer.from(cursor, 'base64url').toString('utf8'), 10);
    if (!Number.isFinite(offset) || offset < 0) return null;
    return offset;
  } catch {
    return null;
  }
}
