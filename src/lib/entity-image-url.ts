/**
 * Entity card art URL resolution (ADR-0003 / TASK-494).
 * Prefer denormalized image_url cache; fall back to bank public_url from join/enrichment.
 */

/** Read nullable image_id from codex/library records (column or camelCase). */
export function readRecordImageId(record: unknown): string | null {
  if (!record || typeof record !== 'object') return null;
  const r = record as Record<string, unknown>;
  const direct = r.image_id ?? r.imageId;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const payload = r.payload;
  if (payload && typeof payload === 'object') {
    const nested = (payload as Record<string, unknown>).image_id ?? (payload as Record<string, unknown>).imageId;
    if (typeof nested === 'string' && nested.trim()) return nested.trim();
  }
  return null;
}

function readJoinedBankPublicUrl(record: Record<string, unknown>): string | null {
  const joined = record.realms_images ?? record.realmsImages;
  if (!joined || typeof joined !== 'object') return null;
  const bank = joined as Record<string, unknown>;
  const url = bank.public_url ?? bank.publicUrl;
  if (typeof url === 'string' && url.trim()) return url.trim();
  return null;
}

function readEnrichedBankPublicUrl(record: Record<string, unknown>): string | null {
  const url = record.realms_image_public_url ?? record.realmsImagePublicUrl;
  if (typeof url === 'string' && url.trim()) return url.trim();
  return null;
}

/** Read optional image_url from codex/library records (cache, join, or payload). */
export function readRecordImageUrl(record: unknown): string | null {
  if (!record || typeof record !== 'object') return null;
  const r = record as Record<string, unknown>;

  const direct = r.image_url ?? r.imageUrl ?? r.card_art_url ?? r.cardArtUrl;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();

  const fromJoin = readJoinedBankPublicUrl(r);
  if (fromJoin) return fromJoin;

  const enriched = readEnrichedBankPublicUrl(r);
  if (enriched) return enriched;

  const payload = r.payload;
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    const nested = p.image_url ?? p.imageUrl ?? p.card_art_url;
    if (typeof nested === 'string' && nested.trim()) return nested.trim();
  }
  return null;
}
