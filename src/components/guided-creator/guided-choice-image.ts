/**
 * Choice-card image resolution for the guided creator.
 * Uses DB `image_url` cache or bank `image_id` resolution when present; otherwise typed placeholders.
 *
 * **Agents:** Also used by list rows via `@/lib/list-row-image.ts` → `ListRowThumbnail` → `ExpandableImage`.
 * Do not duplicate placeholder paths, URL readers, or preview modals. See `AGENT_GUIDE.md` § Entity card art & expandable images.
 */

import { readRecordImageUrl } from '@/lib/entity-image-url';

export type ChoiceCardImageKind = 'species' | 'path' | 'equipment' | 'power' | 'technique';

const PLACEHOLDER_BY_KIND: Record<ChoiceCardImageKind, string> = {
  species: '/images/placeholder-species-card.svg',
  path: '/images/placeholder-path-card.svg',
  equipment: '/images/placeholder-equipment-card.svg',
  power: '/images/placeholder-power-card.svg',
  technique: '/images/placeholder-technique-card.svg',
};

export { readRecordImageUrl } from '@/lib/entity-image-url';

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
