import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.join(import.meta.dirname, '..');

describe('creator stepper and load-modal labels (86e3jx8wy)', () => {
  it('ValueStepper derives ± titles from label when titles are omitted', () => {
    const source = readFileSync(path.join(root, 'patterns/select/value-stepper.tsx'), 'utf8');
    expect(source).toContain('stepperTitlesFromLabel');
    expect(source).toContain('Decrease ${subject}');
    expect(source).toContain('Increase ${subject}');
  });

  it('GridListRow selection toggle names the item for load/add modals', () => {
    const collapsed = readFileSync(
      path.join(root, 'patterns/list/grid-list-row-collapsed.tsx'),
      'utf8',
    );
    expect(collapsed).toContain('gridListRowSelectionLabel');
    expect(collapsed).toContain('Deselect ${itemName}');
    expect(collapsed).toContain('Select ${itemName}');
  });

  it('ability score editor steppers include the ability name', () => {
    const editor = readFileSync(path.join(root, 'creator/ability-score-editor.tsx'), 'utf8');
    expect(editor).toContain('Decrease ${info.name} ability score');
    expect(editor).toContain('Increase ${info.name} ability score');
  });
});
