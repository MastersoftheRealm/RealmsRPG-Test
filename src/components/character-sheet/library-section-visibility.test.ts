import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const featsTab = readFileSync(path.join(import.meta.dirname, 'feats-tab.tsx'), 'utf8');
const inventoryPanel = readFileSync(
  path.join(import.meta.dirname, 'library-inventory-panel.tsx'),
  'utf8',
);

describe('default library subsection visibility (86e3jvcgh)', () => {
  it('always offers State Feats with add + hide toggle in edit mode', () => {
    expect(featsTab).toContain('showStateFeatsSection');
    expect(featsTab).not.toContain('{hasStateFeats &&');
    expect(featsTab).toContain('expandedWhenEmpty');
    expect(featsTab).toContain('LibrarySectionVisibilityToggle');
    expect(featsTab).toContain('No state feats selected');
  });

  it('inventory weapons, shields, and armor use hide toggles and expandedWhenEmpty', () => {
    expect(inventoryPanel).toContain('{wrapSection(');
    expect(inventoryPanel).toContain("sectionToggle('weapons')");
    expect(inventoryPanel).toContain("sectionToggle('shields')");
    expect(inventoryPanel).toContain("sectionToggle('armor')");
    expect(inventoryPanel).toContain('expandedWhenEmpty');
    expect(inventoryPanel).toContain('LibrarySectionVisibilityToggle');
  });
});
