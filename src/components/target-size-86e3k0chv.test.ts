import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const infoTippyPath = path.join(import.meta.dirname, 'patterns/help/info-tippy.tsx');

describe('InfoTippy target size (86e3k0chv)', () => {
  it('default help trigger layout box is at least 24×24 CSS px (WCAG 2.5.8)', () => {
    const source = readFileSync(infoTippyPath, 'utf8');
    expect(source).toContain('min-h-6 min-w-6');
    expect(source).not.toMatch(
      /inline-flex size-4 shrink-0 items-center justify-center rounded-full hit-area-layout-neutral/,
    );
  });
});
