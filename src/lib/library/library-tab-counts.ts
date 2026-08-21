/**
 * Library page tab-count contract (ADR-0015 / TASK-774).
 * Armament split reuses normalizeArmamentKind — do not add a second classifier.
 */

import { countItemsByArmamentKind } from '@/lib/library/official-item-list';

export type LibraryTabCounts = {
  powers: number;
  techniques: number;
  empoweredTechniques: number;
  weapons: number;
  armor: number;
  shields: number;
  creatures: number;
  enhanced: number;
};

/** Library page tab id → ADR-0015 counts field. */
const LIBRARY_TAB_COUNT_FIELD = {
  powers: 'powers',
  techniques: 'techniques',
  'empowered-techniques': 'empoweredTechniques',
  weapons: 'weapons',
  armor: 'armor',
  shields: 'shields',
  creatures: 'creatures',
  enhanced: 'enhanced',
} as const satisfies Record<string, keyof LibraryTabCounts>;

export type LibraryPageTabId = keyof typeof LIBRARY_TAB_COUNT_FIELD;

export const EMPTY_LIBRARY_TAB_COUNTS: LibraryTabCounts = {
  powers: 0,
  techniques: 0,
  empoweredTechniques: 0,
  weapons: 0,
  armor: 0,
  shields: 0,
  creatures: 0,
  enhanced: 0,
};

export function countArmamentsFromTypes(
  types: Array<string | undefined | null>,
): Pick<LibraryTabCounts, 'weapons' | 'armor' | 'shields'> {
  const items = types.map((type) => ({ type: type ?? undefined }));
  return {
    weapons: countItemsByArmamentKind(items, 'weapon'),
    armor: countItemsByArmamentKind(items, 'armor'),
    shields: countItemsByArmamentKind(items, 'shield'),
  };
}

export function libraryTabCount(
  counts: LibraryTabCounts | undefined,
  tabId: LibraryPageTabId,
): number | undefined {
  if (!counts) return undefined;
  return counts[LIBRARY_TAB_COUNT_FIELD[tabId]];
}
