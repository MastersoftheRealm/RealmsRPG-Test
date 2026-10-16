import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NOTES_SECTION_ORDER,
  moveInOrder,
  notesSectionHideBlocked,
  resolveNotesSectionOrder,
  resolveNotesSectionVisibility,
  type NotesTabSectionId,
} from './notes-tab-sections';

function only(sectionId: NotesTabSectionId) {
  const visibility = Object.fromEntries(
    DEFAULT_NOTES_SECTION_ORDER.map((id) => [id, id === sectionId]),
  ) as Record<NotesTabSectionId, boolean>;
  return visibility;
}

describe('notes tab sections (86e3jvcgp)', () => {
  it('merges persisted order with defaults for backward compatibility', () => {
    expect(resolveNotesSectionOrder(['backstory', 'appearance'])).toEqual([
      'backstory',
      'appearance',
      'physical',
      'archetypeDesc',
      'generalNotes',
      'customNotes',
    ]);
    expect(resolveNotesSectionOrder(undefined)).toEqual(DEFAULT_NOTES_SECTION_ORDER);
  });

  it('blocks hiding the last visible notes section', () => {
    expect(notesSectionHideBlocked(only('generalNotes'), 'generalNotes')).toBe(true);
    expect(notesSectionHideBlocked(only('generalNotes'), 'appearance')).toBe(false);
    expect(notesSectionHideBlocked({}, 'appearance')).toBe(false);
  });

  it('moves ids within an order array', () => {
    const order = ['a', 'b', 'c'] as const;
    expect(moveInOrder(order, 'b', 'up')).toEqual(['b', 'a', 'c']);
    expect(moveInOrder(order, 'b', 'down')).toEqual(['a', 'c', 'b']);
    expect(moveInOrder(order, 'a', 'up')).toEqual(['a', 'b', 'c']);
  });

  it('defaults missing visibility to visible', () => {
    expect(resolveNotesSectionVisibility({ appearance: false }).appearance).toBe(false);
    expect(resolveNotesSectionVisibility({ appearance: false }).backstory).toBe(true);
  });
});
