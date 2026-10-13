import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sectionPath = path.join(import.meta.dirname, 'collapsible-section.tsx');
const inventoryPath = path.join(
  import.meta.dirname,
  '../../app/(main)/creature-creator/creature-creator-editor-inventory-section.tsx',
);

describe('CollapsibleSection optional enable row (86e3jyh59)', () => {
  it('stacks enable CTA below title on narrow viewports', () => {
    const source = readFileSync(sectionPath, 'utf8');
    expect(source).toMatch(/optional && !enabled[\s\S]*flex flex-col gap-3 sm:flex-row/);
    expect(source).toContain('className="w-full shrink-0 sm:w-auto"');
    expect(source).toContain('+ Enable {title}');
    expect(source).toContain('line-clamp-2');
  });

  it('creature inventory uses optional CollapsibleSection for Enable Inventory', () => {
    const inventory = readFileSync(inventoryPath, 'utf8');
    expect(inventory).toContain('title="Inventory"');
    expect(inventory).toContain('optional');
    expect(inventory).toContain('enableArmaments');
  });
});
