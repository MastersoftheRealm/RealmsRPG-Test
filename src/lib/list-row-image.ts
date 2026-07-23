/**
 * List-row thumbnail resolution — shared with guided choice cards (TASK-405 / TASK-532 / TASK-533).
 * Use `resolveListRowThumbnail(kind, record, name)` for species, creature, equipment, power, technique.
 * Returns light placeholder paths; `ListRowThumbnail` swaps to `-dark.svg` via `usePlaceholderTheme`.
 *
 * **Agents:** Use with `GridListRow` `thumbnail` + `ListHeader.hasThumbnailColumn`.
 * Full guide: `guide/03-entity-card-art.md`.
 */

import {
  readRecordImageUrl,
  resolveChoiceCardImage,
  type ChoiceCardImageKind,
} from '@/components/guided-creator/guided-choice-image';
import type { ListRowThumbnailProps } from '@/components/shared/list-row-thumbnail';

export type ListRowImageKind = ChoiceCardImageKind;

export function resolveListRowThumbnail(
  kind: ListRowImageKind,
  record: unknown,
  name: string
): ListRowThumbnailProps {
  const { src, isPlaceholder } = resolveChoiceCardImage(kind, record);
  return { src, alt: name, isPlaceholder };
}

/** Species rows: codex, official, or user library records. */
export function resolveSpeciesListRowThumbnail(
  species: { name: string; image_url?: string | null },
  rawRecord?: unknown
): ListRowThumbnailProps {
  const record =
    species.image_url != null
      ? { ...((rawRecord as object) ?? {}), image_url: species.image_url }
      : rawRecord ?? species;
  if (!readRecordImageUrl(record) && species.image_url) {
    return {
      src: species.image_url,
      alt: species.name,
      isPlaceholder: false,
    };
  }
  return resolveListRowThumbnail('species', record, species.name);
}
