import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADMIN_FEAT_MODAL_SELECT_CLASS } from './admin-feat-edit-modal-fields';

const fields = readFileSync(
  path.join(import.meta.dirname, 'admin-feat-edit-modal-fields.tsx'),
  'utf8',
);
const modal = readFileSync(path.join(import.meta.dirname, 'admin-feat-edit-modal.tsx'), 'utf8');

describe('Admin feat edit modal selects (86e3jzu5u)', () => {
  it('uses Input-matching surface chrome instead of bg-background', () => {
    expect(ADMIN_FEAT_MODAL_SELECT_CLASS).toContain('bg-surface');
    expect(ADMIN_FEAT_MODAL_SELECT_CLASS).not.toContain('bg-background');
    expect(fields).not.toMatch(/select[\s\S]*bg-background/);
    expect(modal).toContain('ADMIN_FEAT_MODAL_SELECT_CLASS');
  });
});
