import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const editor = readFileSync(new URL('./species-creator-editor.tsx', import.meta.url), 'utf8');
const section = readFileSync(
  new URL('../../../components/creator/collapsible-section.tsx', import.meta.url),
  'utf8',
);
const footer = readFileSync(
  new URL(
    '../../../components/patterns/select/unified-selection-modal-footer.tsx',
    import.meta.url,
  ),
  'utf8',
);

describe('species creator narrow layout (86e3jxbr8)', () => {
  it('puts Traits add buttons on their own row below lg', () => {
    expect(editor).toMatch(/title="Traits"[\s\S]*actionsOnOwnRow/);
    expect(section).toContain('actionsOnOwnRow &&');
    expect(section).toContain('max-lg:w-full');
    expect(section).toContain('basis-full');
  });

  it('wraps the species/ancestry modal footer inside the dialog', () => {
    expect(editor).toContain("wrapFooterActions={mode === 'species_ancestry'}");
    expect(footer).toContain('wrapFooterActions');
    expect(footer).toContain('flex-wrap');
    expect(footer).toContain('[&_button]:max-w-full');
    expect(footer).toContain('[&_button]:whitespace-normal');
    expect(footer).toContain('sm:w-auto [&_button]:flex-1');
  });
});

describe('species ancestry add modal (86e3jzdtb)', () => {
  it('is wider than the 32rem dialog on desktop and keeps the ancestry Add in the footer', () => {
    expect(editor).toContain("size={mode === 'species_ancestry' ? '2xl' : 'lg'}");
    expect(editor).toContain('md:max-h-[min(60vh,calc(90vh-16rem))]');
    expect(editor).not.toContain('className="max-h-[60vh]"');
    expect(footer).toContain("wrapFooterActions ? 'flex-col'");
    expect(footer).toContain('[&_button]:min-h-12');
  });
});
