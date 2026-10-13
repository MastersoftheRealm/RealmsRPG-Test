import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const editorPath = path.join(import.meta.dirname, 'species-creator-editor.tsx');

describe('Species flaw picker one slot (86e3mhqbc)', () => {
  it('blocks replace-in-place when only one flaw slot is open', () => {
    const source = readFileSync(editorPath, 'utf8');
    expect(source).toContain('flawNextSelectedIds');
    expect(source).toMatch(/if \(currentIds\.length >= flawRemaining\) return currentIds/);
    expect(source).toContain("traitSelectionLimitMessage('flaws'");
    expect(source).toContain('selected.length > flawRemaining');
  });
});
