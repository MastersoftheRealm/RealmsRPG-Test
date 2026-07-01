/**
 * Choice-card image resolution for the guided creator.
 * Uses DB `image_url` when present; otherwise typed placeholders until codex art ships.
 */

export type ChoiceCardImageKind = 'species' | 'path' | 'equipment' | 'power' | 'technique';

const PLACEHOLDER_BY_KIND: Record<ChoiceCardImageKind, string> = {
  species: '/images/placeholder-species-card.svg',
  path: '/images/placeholder-path-card.svg',
  equipment: '/images/placeholder-equipment-card.svg',
  power: '/images/placeholder-power-card.svg',
  technique: '/images/placeholder-technique-card.svg',
};

/** Read optional image_url from codex/library records (column or payload). */
export function readRecordImageUrl(record: unknown): string | null {
  if (!record || typeof record !== 'object') return null;
  const r = record as Record<string, unknown>;
  const direct = r.image_url ?? r.imageUrl ?? r.card_art_url ?? r.cardArtUrl;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const payload = r.payload;
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    const nested = p.image_url ?? p.imageUrl ?? p.card_art_url;
    if (typeof nested === 'string' && nested.trim()) return nested.trim();
  }
  return null;
}

export function resolveChoiceCardImage(
  kind: ChoiceCardImageKind,
  record?: unknown
): { src: string; isPlaceholder: boolean } {
  const fromRecord = record ? readRecordImageUrl(record) : null;
  if (fromRecord) return { src: fromRecord, isPlaceholder: false };
  return { src: PLACEHOLDER_BY_KIND[kind], isPlaceholder: true };
}

export type ChoiceCardImageLayout = 'thumb' | 'hero';

/** Species (and future equipment/powers) use larger featured inline art; paths stay thumb-sized. */
export function defaultImageLayoutForKind(kind: ChoiceCardImageKind): ChoiceCardImageLayout {
  return kind === 'species' || kind === 'equipment' || kind === 'power' || kind === 'technique'
    ? 'hero'
    : 'thumb';
}
