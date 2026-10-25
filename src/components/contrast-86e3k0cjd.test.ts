import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.join(import.meta.dirname, '..');

describe('contrast fixes (86e3k0cjd)', () => {
  it('rulebook TOC numerals use secondary text, not muted on primary-subtle rows', () => {
    const nav = readFileSync(path.join(root, 'components/rules/rulebook-nav.tsx'), 'utf8');
    expect(nav).toContain('text-text-secondary tabular-nums');
    expect(nav).not.toMatch(/text-text-muted tabular-nums/);
  });

  it('creature summary resource box labels avoid opacity that lowers contrast', () => {
    const panel = readFileSync(
      path.join(root, 'components/creator/creator-summary-panel.tsx'),
      'utf8',
    );
    const boxes = panel.slice(panel.indexOf('resourceBoxes &&'), panel.indexOf('Badge (Rarity'));
    expect(boxes).toContain('text-[10px]');
    expect(boxes).toContain('font-semibold');
    expect(boxes).toContain('text-inherit');
    expect(boxes).toContain('uppercase');
    expect(boxes).not.toContain('opacity-80');
  });

  it('Add Property disabled reason uses readable secondary text', () => {
    const props = readFileSync(
      path.join(root, 'app/(main)/item-creator/item-creator-editor-ability-properties.tsx'),
      'utf8',
    );
    expect(props).toContain('text-text-secondary');
    expect(props).toContain('addPropertyReasonId');
  });
});
