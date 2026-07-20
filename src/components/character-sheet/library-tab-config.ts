/**
 * Library tab visibility defaults and active-tab resolution.
 */

import type { CharacterLibraryTabId } from '@/types';

export type TabType = CharacterLibraryTabId;

export const DEFAULT_TAB_VISIBILITY: Record<TabType, boolean> = {
  feats: true,
  powers: true,
  techniques: true,
  inventory: true,
  proficiencies: true,
  notes: true,
};

/** Tab order used for visibility fallbacks (sheet owns active-tab state). */
export const LIBRARY_TAB_ORDER: TabType[] = [
  'feats',
  'powers',
  'techniques',
  'inventory',
  'proficiencies',
  'notes',
];

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
