/**
 * Shared types/labels for My Library entity tabs (ADR-0001).
 */

/** Labels for search/sort/list chrome only (`enableSync={false}`). */
export interface LibraryEntityTabBasicLabels {
  searchPlaceholder: string;
  loadErrorMessage: string;
  emptyTitle: string;
  emptyMessage: string;
  createHref: string;
  createLabel: string;
  searchEmptyTitle: string;
}

export interface LibraryEntityTabLabels extends LibraryEntityTabBasicLabels {
  entitySingular: string;
  entityPlural: string;
  duplicateTitle: string;
  /** Tail of sync-all description after the count phrase. */
  syncAllRemovedRefsHint: string;
}

export const ARMAMENT_LIBRARY_LABELS: LibraryEntityTabLabels = {
  entitySingular: 'armament',
  entityPlural: 'armaments',
  searchPlaceholder: 'Search armaments...',
  loadErrorMessage: 'Failed to load armaments',
  emptyTitle: 'No armaments yet',
  emptyMessage: 'Create your first weapon, armor, or equipment to see it here.',
  createHref: '/item-creator',
  createLabel: 'Create Armament',
  searchEmptyTitle: 'No armaments match your search.',
  duplicateTitle: 'Duplicate armament?',
  syncAllRemovedRefsHint: 'Properties that no longer exist in the codex may be removed.',
};

export const POWER_LIBRARY_LABELS: LibraryEntityTabLabels = {
  entitySingular: 'power',
  entityPlural: 'powers',
  searchPlaceholder: 'Search powers...',
  loadErrorMessage: 'Failed to load powers',
  emptyTitle: 'No powers yet',
  emptyMessage: 'Create your first power to see it here in your library.',
  createHref: '/power-creator',
  createLabel: 'Create Power',
  searchEmptyTitle: 'No powers match your search.',
  duplicateTitle: 'Duplicate power?',
  syncAllRemovedRefsHint: 'Parts that no longer exist in the codex may be removed.',
};

export const TECHNIQUE_LIBRARY_LABELS: LibraryEntityTabLabels = {
  entitySingular: 'technique',
  entityPlural: 'techniques',
  searchPlaceholder: 'Search techniques...',
  loadErrorMessage: 'Failed to load techniques',
  emptyTitle: 'No techniques yet',
  emptyMessage: 'Create your first technique to see it here in your library.',
  createHref: '/technique-creator',
  createLabel: 'Create Technique',
  searchEmptyTitle: 'No techniques match your search.',
  duplicateTitle: 'Duplicate technique?',
  syncAllRemovedRefsHint: 'Parts that no longer exist in the codex may be removed.',
};

export const EMPOWERED_TECHNIQUE_LIBRARY_LABELS: LibraryEntityTabLabels = {
  entitySingular: 'empowered technique',
  entityPlural: 'empowered techniques',
  searchPlaceholder: 'Search techniques...',
  loadErrorMessage: 'Failed to load techniques',
  emptyTitle: 'No empowered techniques yet',
  emptyMessage: 'Create your first empowered technique to see it here in your library.',
  createHref: '/empowered-technique-creator',
  createLabel: 'Create Empowered Technique',
  searchEmptyTitle: 'No empowered techniques match your search.',
  duplicateTitle: 'Duplicate empowered technique?',
  syncAllRemovedRefsHint: 'Parts that no longer exist in the codex may be removed.',
};

export const CREATURE_LIBRARY_LABELS: LibraryEntityTabLabels = {
  entitySingular: 'creature',
  entityPlural: 'creatures',
  searchPlaceholder: 'Search creatures...',
  loadErrorMessage: 'Failed to load creatures',
  emptyTitle: 'No creatures yet',
  emptyMessage: 'Create your first creature to see it here in your library.',
  createHref: '/creature-creator',
  createLabel: 'Create Creature',
  searchEmptyTitle: 'No creatures match your search.',
  duplicateTitle: 'Duplicate creature?',
  syncAllRemovedRefsHint:
    'Parts, techniques, or properties that no longer exist in the codex may be removed.',
};

/** Enhanced equipment — list chrome only (no patch sync / duplicate). */
export const ENHANCED_LIBRARY_LABELS: LibraryEntityTabBasicLabels = {
  searchPlaceholder: 'Search by name, base item, or power...',
  loadErrorMessage: 'Failed to load enhanced items',
  emptyTitle: 'No enhanced items yet',
  emptyMessage:
    'Complete an enhanced crafting session and choose "Save to Library" to add enhanced equipment here.',
  createHref: '/crafting',
  createLabel: 'Go to Crafting',
  searchEmptyTitle: 'No enhanced items match your search.',
};
