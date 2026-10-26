/**
 * Normalize codex part ids for library JSON payloads (numbers in DB; avoid "6" strings).
 */
export function coerceSavedPartId(id: number | string): number | string {
  if (typeof id === 'number' && Number.isFinite(id)) return id;
  const raw = String(id).trim();
  if (/^s\d+$/i.test(raw)) {
    const n = Number(raw.slice(1));
    return Number.isFinite(n) ? n : id;
  }
  if (/^\d+$/.test(raw)) return Number(raw);
  return id;
}
