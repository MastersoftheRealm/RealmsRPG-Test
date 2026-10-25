import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../../app/globals.css', import.meta.url), 'utf8');
const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const rollLog = readFileSync(
  new URL('../../../components/rolls/roll-log.tsx', import.meta.url),
  'utf8',
);

describe('creature creator content width (86e3jzdw5 / 86e3jywe6)', () => {
  it('does not right-pad the main column when the creator roll dock is mounted', () => {
    expect(css).toMatch(
      /#main-content:has\(\.floating-dock-bottom-right\):has\(\[data-creator-roll-dock\]\)\s*\{[^}]*padding-right:\s*0/,
    );
  });

  it('keeps the corner gap on the roll-log button', () => {
    const button = css.match(
      /\[data-creator-roll-dock\]\.floating-dock-bottom-right\s*\{[^}]*\}/,
    )?.[0];
    expect(button).toBeDefined();
    expect(button).toContain('right: var(--dock-gap)');
    expect(button).toContain('bottom: var(--dock-bottom)');
  });

  it('still reserves the right edge on other pages that mount the floating dock', () => {
    expect(css).toMatch(
      /#main-content:has\(\.floating-dock-bottom-right\)\s*\{[^}]*padding-right:\s*var\(--dock-reserved-end\)/,
    );
  });

  it('tags that dock only on creator routes, where creature creator is the page that mounts it', () => {
    expect(rollLog).toContain('data-creator-roll-dock');
    expect(rollLog).toContain('onCreatorRoute');
    expect(rollLog).toContain('isCreatorRoutePath');
  });

  it('caps the summary card before the roll-log button without restoring the page end pad', () => {
    expect(page).toContain('creature-creator-summary-fab-clear');
    expect(css).toContain('.creature-creator-summary-fab-clear');
    expect(css).toContain('max-width: calc(100% - var(--creator-fab-overlap))');
    expect(css).toContain('--creator-inline-pad: 1rem');
    expect(css).toContain('--creator-inline-pad: 1.5rem');
    expect(css).toContain('--creator-inline-pad: 2rem');

    const clearRules = css.match(/\.creature-creator-summary-fab-clear\s*\{[^}]*\}/g) ?? [];
    expect(clearRules.length).toBeGreaterThan(0);
    expect(clearRules.join('\n')).not.toContain('dock-reserved-end');
    expect(clearRules.join('\n')).not.toContain('padding-right');
  });
});
