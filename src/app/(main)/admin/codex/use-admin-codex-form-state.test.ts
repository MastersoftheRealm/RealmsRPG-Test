import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('useAdminCodexFormState', () => {
  it('syncs a ref on every render so getForm reads the latest draft', () => {
    const src = readFileSync(
      path.join(import.meta.dirname, 'use-admin-codex-form-state.ts'),
      'utf8',
    );
    expect(src).toContain('useLayoutEffect');
    expect(src).toContain('formRef.current = form');
    expect(src).toContain('const getForm = useCallback(() => formRef.current, []);');
  });
});
