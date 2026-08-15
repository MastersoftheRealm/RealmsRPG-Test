/**
 * Choice-card image resolution for the guided creator.
 * Uses DB `image_url` cache or bank `image_id` resolution when present; otherwise typed placeholders.
 *
 * **Agents:** Also used by list rows via `@/lib/list-row-image.ts` → `ListRowThumbnail` → `ExpandableImage`.
 * Do not duplicate placeholder paths, URL readers, or preview modals. See `AGENT_GUIDE.md` § Entity card art & expandable images.
 */

import { readRecordImageUrl } from '@/lib/entity-image-url';
import {
  getPlaceholderCardArtPath,
  type ChoiceCardImageKind,
  type PlaceholderTheme,
} from '@/lib/placeholder-art';

export type { ChoiceCardImageKind, PlaceholderTheme } from '@/lib/placeholder-art';

export { readRecordImageUrl } from '@/lib/entity-image-url';

export function resolveChoiceCardImage(
  kind: ChoiceCardImageKind,
  record?: unknown,
  theme: PlaceholderTheme = 'light',
): { src: string; isPlaceholder: boolean } {
  const fromRecord = record ? readRecordImageUrl(record) : null;
  if (fromRecord) return { src: fromRecord, isPlaceholder: false };
  return { src: getPlaceholderCardArtPath(kind, theme), isPlaceholder: true };
}

export type ChoiceCardImageLayout = 'thumb' | 'hero';

/** Species (and future equipment/powers) use larger featured inline art; paths stay thumb-sized. */
export function defaultImageLayoutForKind(kind: ChoiceCardImageKind): ChoiceCardImageLayout {
  return kind === 'species' ||
    kind === 'creature' ||
    kind === 'equipment' ||
    kind === 'power' ||
    kind === 'technique'
    ? 'hero'
    : 'thumb';
}
