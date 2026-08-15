/**
 * Default character-sheet Library tab visibility from archetype category.
 *
 * DESIGN_INTENT: Reuse persisted `libraryTabVisibility` (same prefs as the sheet
 * Library eye toggle). Do not invent a second hide system. Power/martial-only
 * create hides the unused opposite tab; Powered-Martial leaves both visible.
 *
 * - Power-only → hide Techniques
 * - Martial-only → hide Powers
 * - Powered-Martial → both visible (no override)
 */

import type { CharacterLibraryTabId } from '@/types';

export function defaultLibraryTabVisibilityForArchetype(
  type?: string | null,
): Partial<Record<CharacterLibraryTabId, boolean>> | undefined {
  if (type === 'power') return { techniques: false };
  if (type === 'martial') return { powers: false };
  return undefined;
}
