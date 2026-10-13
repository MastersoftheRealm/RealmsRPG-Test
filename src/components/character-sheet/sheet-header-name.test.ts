import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sheetHeaderNameClamped } from './sheet-header-name';

const identity = readFileSync(new URL('./sheet-header-identity.tsx', import.meta.url), 'utf8');
const confirmModal = readFileSync(
  new URL('../patterns/chrome/confirm-action-modal.tsx', import.meta.url),
  'utf8',
);
const modal = readFileSync(new URL('../ui/modal.tsx', import.meta.url), 'utf8');

describe('sheet header name (86e3jvjhu)', () => {
  it('treats a taller scroll box as clamped', () => {
    expect(sheetHeaderNameClamped(48, 40)).toBe(true);
    expect(sheetHeaderNameClamped(40, 40)).toBe(false);
    expect(sheetHeaderNameClamped(41, 40)).toBe(false);
  });

  it('uses the full identity column and expands a clamped name without a hover title', () => {
    expect(identity).toContain('sheetHeaderNameClamped');
    expect(identity).toContain('min-w-0 flex-1');
    expect(identity).toContain("!nameExpanded && 'line-clamp-2'");
    expect(identity).toContain('break-normal');
    expect(identity).not.toContain('title={character.name}');
    expect(identity).not.toContain('break-words">{character.name}');
    expect(identity).toContain('aria-expanded={nameExpanded}');
  });

  it('wraps a long delete-confirm title inside the dialog', () => {
    expect(confirmModal).toContain('w-full min-w-0');
    expect(confirmModal).toContain('break-words');
    expect(modal).toContain('w-full min-w-0 overflow-hidden');
  });
});
