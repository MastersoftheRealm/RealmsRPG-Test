import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NOTES_SECTION_ORDER,
  notesSectionHideBlocked,
} from '@/lib/character/notes-tab-sections';

const notesTab = readFileSync(path.join(import.meta.dirname, 'notes-tab.tsx'), 'utf8');
const buildData = readFileSync(
  path.join(import.meta.dirname, 'build-library-section-data.ts'),
  'utf8',
);

describe('notes reorder and hide (86e3jvcgp)', () => {
  it('persists section order and visibility on the character blob', () => {
    expect(buildData).toContain('notesSectionOrder: character.notesSectionOrder');
    expect(buildData).toContain('notesSectionVisibility: character.notesSectionVisibility');
    expect(buildData).toContain('onNotesSectionOrderChange');
    expect(buildData).toContain('onReorderNamedNote');
  });

  it('renders sections from resolved order and wires edit chrome', () => {
    expect(notesTab).toContain('resolveNotesSectionOrder');
    expect(notesTab).toContain('isNotesSectionVisible');
    expect(notesTab).toContain('NotesTabEditControls');
    expect(notesTab).toContain('namedNoteHideBlocked');
  });

  it('blocks hiding the last visible notes section', () => {
    const onlyPhysical = Object.fromEntries(
      DEFAULT_NOTES_SECTION_ORDER.map((id) => [id, id === 'physical']),
    ) as Record<string, boolean>;
    expect(notesSectionHideBlocked(onlyPhysical, 'physical')).toBe(true);
  });
});
