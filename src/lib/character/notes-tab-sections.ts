/**
 * Notes tab section order and visibility (character JSON — no schema migration).
 * Mirrors library tab visibility: hidden sections stay visible in edit mode.
 */

import type { NotesTabSectionId } from '@/types';

export type { NotesTabSectionId };

export type NotesTabSectionDef = { id: NotesTabSectionId; title: string };

export const NOTES_TAB_SECTION_DEFS: NotesTabSectionDef[] = [
  { id: 'physical', title: 'Physical Attributes & Movement' },
  { id: 'appearance', title: 'Appearance' },
  { id: 'backstory', title: 'Backstory' },
  { id: 'archetypeDesc', title: 'Archetype Description' },
  { id: 'generalNotes', title: 'General Notes' },
  { id: 'customNotes', title: 'Custom Notes' },
];

export const DEFAULT_NOTES_SECTION_ORDER: NotesTabSectionId[] = NOTES_TAB_SECTION_DEFS.map(
  (s) => s.id,
);

export const DEFAULT_NOTES_SECTION_VISIBILITY: Record<NotesTabSectionId, boolean> = {
  physical: true,
  appearance: true,
  backstory: true,
  archetypeDesc: true,
  generalNotes: true,
  customNotes: true,
};

export function resolveNotesSectionOrder(
  order?: NotesTabSectionId[] | undefined,
): NotesTabSectionId[] {
  const seen = new Set<NotesTabSectionId>();
  const resolved: NotesTabSectionId[] = [];
  for (const id of order ?? []) {
    if (!DEFAULT_NOTES_SECTION_VISIBILITY[id] || seen.has(id)) continue;
    seen.add(id);
    resolved.push(id);
  }
  for (const id of DEFAULT_NOTES_SECTION_ORDER) {
    if (!seen.has(id)) resolved.push(id);
  }
  return resolved;
}

export function resolveNotesSectionVisibility(
  visibility?: Partial<Record<NotesTabSectionId, boolean>> | undefined,
): Record<NotesTabSectionId, boolean> {
  return {
    ...DEFAULT_NOTES_SECTION_VISIBILITY,
    ...(visibility ?? {}),
  } as Record<NotesTabSectionId, boolean>;
}

/** Hide is blocked when this section is the only one still visible outside edit mode. */
export function notesSectionHideBlocked(
  visibility: Partial<Record<NotesTabSectionId, boolean>>,
  sectionId: NotesTabSectionId,
): boolean {
  const resolved = resolveNotesSectionVisibility(visibility);
  if (resolved[sectionId] === false) return false;
  const visibleCount = DEFAULT_NOTES_SECTION_ORDER.filter((id) => resolved[id] !== false).length;
  return visibleCount <= 1;
}

export function moveInOrder<T>(order: readonly T[], id: T, direction: 'up' | 'down'): T[] {
  const index = order.indexOf(id);
  if (index === -1) return [...order];
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= order.length) return [...order];
  const next = [...order];
  const current = next[index];
  const swap = next[target];
  if (current === undefined || swap === undefined) return [...order];
  next[index] = swap;
  next[target] = current;
  return next;
}

export function isNotesSectionVisible(
  sectionId: NotesTabSectionId,
  options: {
    isEditMode: boolean;
    visibility?: Partial<Record<NotesTabSectionId, boolean>> | undefined;
  },
): boolean {
  if (options.isEditMode) return true;
  return resolveNotesSectionVisibility(options.visibility)[sectionId] !== false;
}

export function namedNoteHideBlocked(
  notes: { id: string; hidden?: boolean | undefined }[],
  noteId: string,
): boolean {
  const visible = notes.filter((note) => !note.hidden);
  if (visible.length <= 1 && visible[0]?.id === noteId) return true;
  return false;
}
