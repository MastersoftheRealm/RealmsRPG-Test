import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./notes-tab.tsx', import.meta.url), 'utf8');

describe('custom note name overflow (86e3jvzrk)', () => {
  it('truncates the read-only name inside the card', () => {
    expect(source).toContain(
      'className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary"',
    );
  });

  it('truncates the editable name and keeps the delete control from being pushed out', () => {
    expect(source).toContain('<span className="truncate">{note.name}</span>');
    expect(source).toContain('<span className="shrink-0">');
    expect(source).not.toContain(
      'className="flex-1 cursor-pointer text-sm font-medium text-text-primary hover:text-primary-fg-hover"',
    );
  });
});
