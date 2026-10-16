/**
 * Character-sheet Library subsection visibility (within Feats / Inventory tabs).
 *
 * DESIGN_INTENT: Same persistence model as `libraryTabVisibility` — `false` hides
 * the section outside edit mode; edit mode always lists sections with an eye toggle.
 * Missing keys mean visible (backward compatible with saves before TASK-86e3jvcgh).
 */

import type { CharacterLibrarySectionId } from '@/types';

export const DEFAULT_LIBRARY_SECTION_VISIBILITY: Record<CharacterLibrarySectionId, boolean> = {
  stateFeats: true,
  weapons: true,
  shields: true,
  armor: true,
};

export function resolveLibrarySectionVisibility(
  prefs?: Partial<Record<CharacterLibrarySectionId, boolean>> | undefined,
): Record<CharacterLibrarySectionId, boolean> {
  return { ...DEFAULT_LIBRARY_SECTION_VISIBILITY, ...(prefs ?? {}) };
}

/** Whether the section should render outside sheet edit mode. */
export function librarySectionVisibleOutsideEdit(
  sectionId: CharacterLibrarySectionId,
  prefs?: Partial<Record<CharacterLibrarySectionId, boolean>> | undefined,
): boolean {
  return resolveLibrarySectionVisibility(prefs)[sectionId] !== false;
}

export const LIBRARY_SECTION_LABELS: Record<CharacterLibrarySectionId, string> = {
  stateFeats: 'State Feats',
  weapons: 'Weapons',
  shields: 'Shields',
  armor: 'Armor',
};
