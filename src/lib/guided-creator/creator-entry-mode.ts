/**
 * Chooser entry mode — guided (L1 faces) vs custom (deeper catalog faces).
 * REALMS §5.0: Custom chooser lands on Path L3; later steps open full catalogs when
 * the player is forging without a curated path.
 */

import type { GuidedDraft } from '@/stores/guided-creator-store';

export type CreatorEntryMode = 'guided' | 'custom';

export function prefersDeepCatalogEntry(
  draft: Pick<GuidedDraft, 'creatorEntryMode' | 'archetypePathId'>
): boolean {
  return draft.creatorEntryMode === 'custom' && !draft.archetypePathId;
}
