import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const loginPrompt = readFileSync(path.join(import.meta.dirname, 'login-prompt-modal.tsx'), 'utf8');
const authCard = readFileSync(path.join(import.meta.dirname, '../../auth/auth-card.tsx'), 'utf8');
const modal = readFileSync(path.join(import.meta.dirname, '../../ui/modal.tsx'), 'utf8');

describe('guest login prompt mobile contrast (86e3jxfca)', () => {
  it('uses readable secondary body copy on LoginPromptModal', () => {
    expect(loginPrompt).toContain('text-text-secondary');
    expect(loginPrompt).not.toMatch(/mb-6 text-text-muted/);
    expect(loginPrompt).toContain('fullScreenOnMobile');
  });

  it('keeps auth login card opaque below md (guest Log In redirect)', () => {
    expect(authCard).toContain('bg-surface md:bg-surface/95 md:backdrop-blur-md');
    expect(authCard).not.toMatch(/'bg-surface\/95 backdrop-blur-md'/);
  });

  it('uses solid background scrim for full-screen mobile modals', () => {
    expect(modal).toMatch(/useFullScreenMobile[\s\S]*\? 'bg-background'/);
    expect(modal).toMatch(/: 'bg-black\/60 backdrop-blur-sm'/);
  });
});
