import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(import.meta.dirname, '../../../..');
const componentSource = readFileSync(
  path.join(repoRoot, 'src/components/shared/guided-choice/guided-inline-catalog-list.tsx'),
  'utf8'
);

describe('GuidedInlineCatalogList selected panel chrome (TASK-700)', () => {
  it('uses balanced card inset on the shared selected panel wrapper', () => {
    expect(componentSource).toMatch(
      /const GUIDED_INLINE_CATALOG_SELECTED_PANEL_CHROME\s*=\s*['"][^'"]*px-4[^'"]*pt-3[^'"]*pb-3[^'"]*gap-2[^'"]*['"]/
    );
  });

  it('does not leave title-only or row-only horizontal padding on the card', () => {
    expect(componentSource).not.toMatch(/selectedTitle[\s\S]*px-4 pt-4 pb-2/);
    expect(componentSource).not.toMatch(/flex flex-col gap-1 pb-2/);
    expect(componentSource).toContain('className={GUIDED_INLINE_CATALOG_SELECTED_PANEL_CHROME}');
    expect(componentSource).toContain('className="mb-0"');
  });
});

describe('GuidedInlineCatalogList selected-panel jump (TASK-728)', () => {
  it('mounts the Selected card only when there is a selection (no reserved empty hole)', () => {
    expect(componentSource).toMatch(/hasSelectedPanel \? \(/);
    expect(componentSource).toContain('stabilizeAfterSelectedHeightChange');
    expect(componentSource).toContain('[overflow-anchor:none]');
    expect(componentSource).toMatch(/hasSelectedPanel && 'pb-4'/);
    expect(componentSource).not.toMatch(/min-h-\[(?:1[2-9]|[2-9]\d)/);
  });
});
