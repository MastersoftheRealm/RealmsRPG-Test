/**
 * Shared armament list chrome labels (Library My + Realms + admin).
 */

export type ArmamentLibraryKind = 'weapon' | 'armor' | 'shield';

export interface ArmamentKindChromeLabels {
  entitySingular: string;
  entityPlural: string;
  searchPlaceholder: string;
  loadErrorMessage: string;
  emptyTitle: string;
  emptyMessage: string;
  searchEmptyTitle: string;
  realmsEmptyMessage: string;
  realmsLoadErrorMessage: string;
}

export const ARMAMENT_LABELS_BY_KIND: Record<ArmamentLibraryKind, ArmamentKindChromeLabels> = {
  weapon: {
    entitySingular: 'weapon',
    entityPlural: 'weapons',
    searchPlaceholder: 'Search weapons...',
    loadErrorMessage: 'Failed to load weapons',
    emptyTitle: 'No weapons yet',
    emptyMessage: 'Create your first weapon to see it here.',
    searchEmptyTitle: 'No weapons match your search.',
    realmsEmptyMessage: 'Official weapons will appear here when added to Realms Library.',
    realmsLoadErrorMessage: 'Failed to load Realms Library weapons',
  },
  armor: {
    entitySingular: 'armor',
    entityPlural: 'armor',
    searchPlaceholder: 'Search armor...',
    loadErrorMessage: 'Failed to load armor',
    emptyTitle: 'No armor yet',
    emptyMessage: 'Create your first armor to see it here.',
    searchEmptyTitle: 'No armor matches your search.',
    realmsEmptyMessage: 'Official armor will appear here when added to Realms Library.',
    realmsLoadErrorMessage: 'Failed to load Realms Library armor',
  },
  shield: {
    entitySingular: 'shield',
    entityPlural: 'shields',
    searchPlaceholder: 'Search shields...',
    loadErrorMessage: 'Failed to load shields',
    emptyTitle: 'No shields yet',
    emptyMessage: 'Create your first shield to see it here.',
    searchEmptyTitle: 'No shields match your search.',
    realmsEmptyMessage: 'Official shields will appear here when added to Realms Library.',
    realmsLoadErrorMessage: 'Failed to load Realms Library shields',
  },
};
