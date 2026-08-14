/**
 * Chooser entry mode — guided (L1 faces) vs custom (deeper catalog faces).
 * REALMS §5.0: Custom chooser lands on Path L3; later steps open full catalogs when
 * the player is forging without a curated path.
 */

import type { Abilities } from '@/types';
import { DEFAULT_ABILITIES } from '@/types';
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

function sameAbilityScores(a: Abilities, b: Abilities): boolean {
  return (Object.keys(DEFAULT_ABILITIES) as Array<keyof Abilities>).every(
    (key) => (a[key] ?? 0) === (b[key] ?? 0)
  );
}

/**
 * Draft patch that keeps the saved abilities equal to the recommendation on screen, or
 * `null` when nothing should be written (report 03 P1-9).
 *
 * `resolveGuidedRecommendedAbilities` returns a suggested-array fallback until the
 * archetype codex resolves, so writing during the fetch window used to lock
 * `abilitiesMode` to `'recommended'` holding the *fallback* scores while the panel went on
 * to render the path's array — the player saw one build and saved another. Two rules close
 * it: never write while the path is still loading, and re-sync whenever the recommendation
 * changes underneath an existing `'recommended'` mode.
 */
export function resolveGuidedRecommendedAbilitiesPatch(args: {
  recommended: Abilities | null;
  draftAbilities: Abilities;
  abilitiesMode: 'recommended' | 'custom' | null;
  customizing: boolean;
  /** Archetype codex still in flight for the selected path — its recommendation is not final. */
  pathLoading: boolean;
}): { abilities: Abilities; abilitiesMode: 'recommended' } | null {
  const { recommended, draftAbilities, abilitiesMode, customizing, pathLoading } = args;
  if (!recommended || customizing || pathLoading) return null;
  if (abilitiesMode === 'custom') return null;
  if (abilitiesMode === 'recommended' && sameAbilityScores(draftAbilities, recommended)) {
    return null;
  }
  return { abilities: recommended, abilitiesMode: 'recommended' };
}
