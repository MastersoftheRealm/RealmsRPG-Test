import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GridListRow } from '@/components/patterns/list/grid-list-row';

const root = path.join(import.meta.dirname, '..');

describe('creator stepper and load-modal labels (86e3jx8wy)', () => {
  it('ValueStepper derives ± titles from label when titles are omitted', () => {
    const source = readFileSync(path.join(root, 'patterns/select/value-stepper.tsx'), 'utf8');
    expect(source).toContain('stepperTitlesFromLabel');
    expect(source).toContain('Decrease ${subject}');
    expect(source).toContain('Increase ${subject}');
  });

  it('GridListRow selection toggle names the item for load/add modals', () => {
    const html = renderToStaticMarkup(
      <GridListRow
        name="Arcane Bolt"
        selectable
        isSelected={false}
        onSelect={() => {}}
        rowChrome={{ externalSelection: true }}
      />,
    );
    expect(html).toContain('aria-label="Select Arcane Bolt"');
  });

  it('ability score editor steppers include the ability name', () => {
    const editor = readFileSync(path.join(root, 'creator/ability-score-editor.tsx'), 'utf8');
    expect(editor).toContain('Decrease ${info.name} ability score');
    expect(editor).toContain('Increase ${info.name} ability score');
  });
});
