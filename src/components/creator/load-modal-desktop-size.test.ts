import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('load and add-library modals use desktop width (86e3jzdu3)', () => {
  it('LoadFromLibraryModal uses xl on desktop', () => {
    const loadModal = readFileSync(
      path.join(import.meta.dirname, 'LoadFromLibraryModal.tsx'),
      'utf8',
    );
    expect(loadModal).toContain('size="xl"');
  });

  it('Add Library Item modal uses xl on desktop', () => {
    const addModal = readFileSync(
      path.join(import.meta.dirname, '../character-sheet/add-library-item-modal.tsx'),
      'utf8',
    );
    expect(addModal).toContain('size="xl"');
  });
});
