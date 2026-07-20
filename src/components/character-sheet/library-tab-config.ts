/**
 * Library tab visibility defaults and active-tab resolution.
 * Single source of truth for tab order (nav + resolveLibraryActiveTab).
 */

import type { CharacterLibraryTabId } from '@/types';

export type TabType = CharacterLibraryTabId;

export type LibraryTabDef = { id: TabType; label: string };

/** Ordered tab definitions — nav and visibility fallbacks both use this. */
export const LIBRARY_TAB_DEFS: LibraryTabDef[] = [
  { id: 'feats', label: 'Feats' },
  { id: 'powers', label: 'Powers' },
  { id: 'techniques', label: 'Techniques' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'proficiencies', label: 'Proficiencies' },
  { id: 'notes', label: 'Notes' },
];

/** Tab order derived from LIBRARY_TAB_DEFS (sheet owns active-tab state). */
export const LIBRARY_TAB_ORDER: TabType[] = LIBRARY_TAB_DEFS.map((t) => t.id);

export const DEFAULT_TAB_VISIBILITY: Record<TabType, boolean> = {
  feats: true,
  powers: true,
  techniques: true,
  inventory: true,
  proficiencies: true,
  notes: true,
};

/** Resolve a visible library tab when the active tab is hidden outside edit mode. */
export function resolveLibraryActiveTab(
  activeTab: TabType,
  options: {
    isEditMode: boolean;
    tabVisibility?: Partial<Record<TabType, boolean>>;
  }
): TabType {
  const visibility = { ...DEFAULT_TAB_VISIBILITY, ...(options.tabVisibility ?? {}) };
  const visible = options.isEditMode
    ? LIBRARY_TAB_ORDER
    : LIBRARY_TAB_ORDER.filter((id) => visibility[id] !== false);
  return visible.includes(activeTab) ? activeTab : (visible[0] ?? 'feats');
}
