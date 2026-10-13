import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./notes-tab.tsx', import.meta.url), 'utf8');

describe('note rename keyboard (86e3jw5mb)', () => {
  it('makes the editable note name a button the keyboard can focus and activate', () => {
    const renameStart = source.indexOf('setIsEditingName(true)');
    const rename = source.slice(Math.max(0, renameStart - 500), renameStart + 40);
    expect(rename).toContain('<button');
    expect(rename).toContain('type="button"');
    expect(rename).toContain('e.stopPropagation()');
    expect(rename).not.toContain('<span');
  });
});
