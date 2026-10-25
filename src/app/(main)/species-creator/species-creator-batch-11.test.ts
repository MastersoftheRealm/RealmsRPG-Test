import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const editor = readFileSync(new URL('./species-creator-editor.tsx', import.meta.url), 'utf8');
const chipList = readFileSync(
  new URL('../creature-creator/CreatureCreatorHelpers.tsx', import.meta.url),
  'utf8',
);
const section = readFileSync(
  new URL('../../../components/creator/collapsible-section.tsx', import.meta.url),
  'utf8',
);

describe('species creator batch 11 layout & a11y', () => {
  it('keeps trait remove controls beside the name, not column edge (86e3jywdg)', () => {
    expect(editor).not.toMatch(/TraitBlock[\s\S]*justify-between/);
    expect(editor).toContain('min-w-0 flex-1 break-words text-text-primary');
    expect(editor).toMatch(/function TraitBlock[\s\S]*className="min-w-0"/);
  });

  it('fixes 375px cosmetics: languages Add row, Name sort label, larger remove hits (86e3jym9a)', () => {
    expect(editor).toContain('flex flex-col items-stretch gap-2 sm:flex-row sm:items-end');
    expect(editor).toContain("label: 'Name'");
    expect(editor).not.toContain("label: 'NAME'");
    expect(editor).toContain('hit-area-dense-square');
    expect(editor).toMatch(/title="Traits"[\s\S]*actionsOnOwnRow/);
    expect(section).toContain("actionsOnOwnRow && 'flex-wrap'");
  });

  it('drops internal id from base skills help copy (86e3jym8y)', () => {
    expect(editor).toContain('one may be &quot;Any&quot;. You cannot pick the same skill twice.');
    expect(editor).not.toContain('(id 0)');
  });

  it('labels trait remove buttons for screen readers (86e3jx1mj)', () => {
    expect(editor).toContain('aria-label={`Remove ${traitName}`}');
  });

  it('wraps long language chips instead of overflowing (86e3jx1m5)', () => {
    expect(chipList).toContain('max-w-full min-w-0');
    expect(chipList).toContain('<span className="min-w-0 break-words">{item}</span>');
    expect(chipList).toContain('hit-area-dense-square');
  });
});
