import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('species creator name and description limits (86e3jx8ww)', () => {
  it('wires species name and description onto the shared limited fields', () => {
    const editor = readFileSync(
      path.join(import.meta.dirname, 'species-creator-editor.tsx'),
      'utf8',
    );
    expect(editor).toContain('<CreatorNameField');
    expect(editor).toContain('<CreatorDescriptionField');
    expect(editor).not.toMatch(/<textarea\b/);

    const fields = readFileSync(
      path.join(import.meta.dirname, '../../../components/creator/creator-text-fields.tsx'),
      'utf8',
    );
    expect(fields).toContain('maxLength={CREATOR_NAME_MAX_LENGTH}');
    expect(fields).toContain('maxLength={CREATOR_DESCRIPTION_MAX_LENGTH}');
  });
});
