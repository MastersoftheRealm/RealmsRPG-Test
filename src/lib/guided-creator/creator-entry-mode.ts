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

/** Continue on Abilities: recommended bypass only when a codex path backs recommendations. */
export function canContinueGuidedAbilitiesStep(args: {
  customizeOnly: boolean;
  abilitiesMode: 'recommended' | 'custom' | null;
  showCustomizePanel: boolean;
  spentPoints: number;
  totalPoints: number;
}): boolean {
  return (
    (!args.customizeOnly && args.abilitiesMode === 'recommended') ||
    (args.showCustomizePanel && args.spentPoints === args.totalPoints)
  );
}
