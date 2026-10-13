import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('species load modal empty copy (86e3jrnc4)', () => {
  it('refers to My Library for private species empty state', () => {
    const source = readFileSync(
      path.join(import.meta.dirname, 'use-load-modal-library.ts'),
      'utf8',
    );
    expect(source).toContain('Save a species to My Library first.');
    expect(source).not.toContain('Save a species to My Codex first.');
  });
});
