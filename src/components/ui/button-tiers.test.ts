import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { rollButtonVariants } from '../patterns/chrome/roll-button';
import { buttonVariants } from './button';
import { iconButtonVariants } from './icon-button';

const usmFooterSource = readFileSync(
  path.join(import.meta.dirname, '../patterns/select/unified-selection-modal-footer.tsx'),
  'utf8',
);

describe('ADR-0023 button touch tiers (TASK-841)', () => {
  it('never applies a global min-w slab', () => {
    const variants = ['primary', 'secondary', 'danger', 'ghost', 'outline', 'link'] as const;
    const sizes = ['sm', 'md', 'lg', 'xl', 'icon'] as const;
    for (const variant of variants) {
      for (const size of sizes) {
        expect(buttonVariants({ variant, size })).not.toMatch(/min-w-\[44px\]/);
      }
    }
    expect(iconButtonVariants({ size: 'md' })).not.toMatch(/min-w-\[44px\]/);
  });

  it('maps md to Standard and lg/xl to Primary', () => {
    expect(buttonVariants({ size: 'md' })).toContain('touch-tier-standard');
    expect(buttonVariants({ size: 'lg' })).toContain('touch-tier-primary');
    expect(buttonVariants({ size: 'xl' })).toContain('touch-tier-primary');
  });

  it('maps size sm and variant link to Dense expanded hit', () => {
    expect(buttonVariants({ size: 'sm' })).toContain('hit-area-dense');
    expect(buttonVariants({ size: 'sm' })).not.toContain('touch-tier-standard');
    expect(buttonVariants({ variant: 'link' })).toContain('hit-area-dense');
  });

  it('sizes IconButton as an explicit square', () => {
    expect(iconButtonVariants({ size: 'sm' })).toContain('hit-area-dense-square');
    expect(iconButtonVariants({ size: 'md' })).toContain('[@media(pointer:coarse)]:h-11');
    expect(iconButtonVariants({ size: 'md' })).toContain('[@media(pointer:coarse)]:w-11');
    expect(iconButtonVariants({ size: 'lg' })).toContain('[@media(pointer:coarse)]:h-12');
  });

  it('tags USM Add Selected as Primary size lg, not a blanket min-h-11 slab', () => {
    expect(usmFooterSource).toMatch(/<Button size="lg" onClick=\{onConfirm\}/);
    expect(usmFooterSource).not.toContain('[&_button]:min-h-11');
  });

  it('wires DeleteConfirmModal as a ConfirmActionModal preset', () => {
    const src = readFileSync(
      path.join(import.meta.dirname, '../patterns/chrome/delete-confirm-modal.tsx'),
      'utf8',
    );
    expect(src).toContain('ConfirmActionModal');
    expect(src).not.toMatch(/from '@\/components\/ui\/modal'/);
  });
});

describe('ADR-0023 sheet skill Dense/Standard (TASK-836)', () => {
  it('keeps skill proficiency dots Dense (16px paint + layout-neutral hit)', () => {
    const skillRow = readFileSync(
      path.join(import.meta.dirname, '../patterns/list/skill-row.tsx'),
      'utf8',
    );
    expect(skillRow).toContain('hit-area-layout-neutral');
    expect(skillRow).toContain('size-4');
    expect(skillRow).toContain('[@media(pointer:coarse)]:py-4');
    expect(skillRow).not.toMatch(/min-w-\[44px\]/);
  });

  it('raises sheet Health/Energy current input to Standard height on coarse pointer', () => {
    const resourceInput = readFileSync(
      path.join(import.meta.dirname, '../character-sheet/sheet-resource-input.tsx'),
      'utf8',
    );
    expect(resourceInput).toContain('touch-tier-standard');
    expect(resourceInput).toContain('w-12');
    expect(resourceInput).not.toMatch(/min-w-\[44px\]/);
  });

  it('uses Dense overlay on the Sub-Skills checkbox, not a viewport 44 slab', () => {
    const skillsSection = readFileSync(
      path.join(import.meta.dirname, '../character-sheet/skills-section.tsx'),
      'utf8',
    );
    expect(skillsSection).toContain('hit-area-layout-neutral');
    expect(skillsSection).toContain('sheet-skills-sub-skills');
    expect(skillsSection).not.toMatch(/min-w-\[44px\]/);
  });
});

describe('ADR-0023 form field Standard tier (TASK-830)', () => {
  it('raises Input, Select, and Textarea with touch-tier-standard and keeps compact h-10 / min-h-100', () => {
    const input = readFileSync(path.join(import.meta.dirname, './input.tsx'), 'utf8');
    const select = readFileSync(path.join(import.meta.dirname, './select.tsx'), 'utf8');
    const textarea = readFileSync(path.join(import.meta.dirname, './textarea.tsx'), 'utf8');
    expect(input).toContain('touch-tier-standard');
    expect(input).toContain('h-10');
    expect(input).not.toMatch(/min-w-\[44px\]/);
    expect(select).toContain('touch-tier-standard');
    expect(select).toContain('h-10');
    expect(select).not.toMatch(/min-w-\[44px\]/);
    expect(textarea).toContain('touch-tier-standard');
    expect(textarea).toContain('min-h-[100px]');
    expect(textarea).not.toMatch(/min-w-\[44px\]/);
  });

  it('raises SearchInput with the same Standard class, not a min-w slab', () => {
    const search = readFileSync(path.join(import.meta.dirname, './search-input.tsx'), 'utf8');
    expect(search).toContain('touch-tier-standard');
    expect(search).not.toMatch(/min-w-\[44px\]/);
  });

  it('keeps FilterInput / FilterNativeSelect on shared h-11 chrome', () => {
    const filterUtils = readFileSync(
      path.join(import.meta.dirname, '../patterns/filters/filter-utils.ts'),
      'utf8',
    );
    expect(filterUtils).toMatch(/FILTER_CONTROL_CLASS =\s*'h-11/);
    expect(filterUtils).toContain('rounded-md');
  });

  it('wires item-creator Description onto shared Textarea', () => {
    const meta = readFileSync(
      path.join(import.meta.dirname, '../../app/(main)/item-creator/item-creator-editor-meta.tsx'),
      'utf8',
    );
    expect(meta).toContain('<Textarea');
    expect(meta).not.toMatch(/<textarea\b/);
  });
});

describe('ADR-0023 leftover viewport hit slabs (TASK-847)', () => {
  it('drops md/min-w 44 hacks on the Codex spreadsheet toolbar', () => {
    const toolbar = readFileSync(
      path.join(import.meta.dirname, '../../app/(main)/admin/codex/codex-spreadsheet-toolbar.tsx'),
      'utf8',
    );
    expect(toolbar).toContain('touch-tier-standard');
    expect(toolbar).not.toMatch(/min-w-\[44px\]/);
    expect(toolbar).not.toContain('md:min-h-0');
    expect(toolbar).not.toContain('md:min-h-[32px]');
  });

  it('does not slab list Filters with max-md 44, and compact toggle is Standard size md', () => {
    const listToolbar = readFileSync(
      path.join(import.meta.dirname, '../patterns/list/list-search-toolbar.tsx'),
      'utf8',
    );
    const filterSection = readFileSync(
      path.join(import.meta.dirname, '../patterns/filters/filter-section.tsx'),
      'utf8',
    );
    expect(listToolbar).not.toContain('toggleClassName');
    expect(listToolbar).not.toMatch(/max-md:min-h-\[44px\]/);
    expect(listToolbar).not.toMatch(/min-w-\[44px\]/);
    expect(filterSection).toContain('size="md"');
    expect(filterSection).not.toContain('min-h-11');
    expect(filterSection).not.toContain('toggleClassName');
    expect(filterSection).not.toContain("variant = 'page'");
    expect(filterSection).not.toContain('isCompact');
  });

  it('uses shared Button for RollLog send, not a raw min-w slab', () => {
    const rollLog = readFileSync(path.join(import.meta.dirname, '../rolls/roll-log.tsx'), 'utf8');
    expect(rollLog).toMatch(/<Button[\s\S]*onClick=\{executeRoll\}/);
    expect(rollLog).not.toMatch(/min-w-\[44px\]/);
    expect(rollLog).not.toMatch(/min-h-\[44px\]/);
  });
});

describe('ADR-0023 header / grid selection / combatant compact (TASK-851)', () => {
  it('uses IconButton for the site header hamburger, not a min-w 44 slab', () => {
    const header = readFileSync(path.join(import.meta.dirname, '../layout/header.tsx'), 'utf8');
    expect(header).toMatch(/<IconButton[\s\S]*label="Toggle navigation menu"/);
    expect(header).not.toMatch(/min-w-\[44px\]/);
    expect(header).not.toMatch(/min-h-\[44px\] min-w-\[44px\]/);
  });

  it('does not wrap GridListRow selection in an always-on min-w 44 / w-11 slab', () => {
    const collapsed = readFileSync(
      path.join(import.meta.dirname, '../patterns/list/grid-list-row-collapsed.tsx'),
      'utf8',
    );
    const chrome = readFileSync(
      path.join(import.meta.dirname, '../patterns/list/grid-list-row-chrome.ts'),
      'utf8',
    );
    const toggle = readFileSync(
      path.join(import.meta.dirname, '../patterns/select/selection-toggle.tsx'),
      'utf8',
    );
    expect(collapsed).not.toMatch(/min-h-\[44px\] w-11 min-w-\[44px\]/);
    expect(collapsed).not.toMatch(/minWidth: GRID_LIST_ROW_SELECTION_COLUMN_WIDTH/);
    expect(chrome).toMatch(
      /GRID_LIST_ROW_SELECTION_COLUMN_WIDTH = GRID_LIST_ROW_ICON_COLUMN_WIDTH/,
    );
    expect(toggle).toContain('touchFloor="coarse"');
  });

  it('raises combatant compact number fields with touch-tier-standard, not md:min-h-0', () => {
    const files = [
      '../encounters/combatant-card-resources.tsx',
      '../encounters/combatant-card-header.tsx',
      '../encounters/combatant-card-quick-actions.tsx',
      '../encounters/combatant-card-conditions.tsx',
    ];
    for (const rel of files) {
      const src = readFileSync(path.join(import.meta.dirname, rel), 'utf8');
      expect(src).toContain('touch-tier-standard');
      expect(src).not.toContain('md:min-h-0');
      expect(src).not.toMatch(/min-h-\[var\(--touch-target-min/);
    }
  });
});

describe('ADR-0023 RollButton Standard tier (TASK-850)', () => {
  it('uses touch-tier-standard, not viewport md:min-h-0', () => {
    const sizes = ['sm', 'md', 'lg', 'xl'] as const;
    for (const size of sizes) {
      expect(rollButtonVariants({ size })).toContain('touch-tier-standard');
      expect(rollButtonVariants({ size })).not.toContain('md:min-h-0');
      expect(rollButtonVariants({ size })).not.toMatch(/min-h-\[var\(--touch-target-min/);
    }
  });
});

describe('ADR-0023 Dense hit alias removed (TASK-857)', () => {
  function collectCssAndTsx(dir: string, acc: string[] = []): string[] {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name === '.next') continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        collectCssAndTsx(full, acc);
        continue;
      }
      if (/\.(test|spec)\.(ts|tsx)$/.test(ent.name)) continue;
      if (/\.(tsx|ts|css)$/.test(ent.name)) acc.push(full);
    }
    return acc;
  }

  it('has no touch-target-md-compact on CSS/TSX call sites', () => {
    const srcRoot = path.join(import.meta.dirname, '../..');
    const hits: string[] = [];
    for (const file of collectCssAndTsx(srcRoot)) {
      const src = readFileSync(file, 'utf8');
      if (src.includes('touch-target-md-compact')) hits.push(path.relative(srcRoot, file));
    }
    expect(hits).toEqual([]);
  });

  it('wires icon-only Dense onto hit-area-dense-square and text Dense onto hit-area-dense', () => {
    const editToggle = readFileSync(
      path.join(import.meta.dirname, '../patterns/chrome/edit-section-toggle.tsx'),
      'utf8',
    );
    const chip = readFileSync(path.join(import.meta.dirname, './chip.tsx'), 'utf8');
    const segmented = readFileSync(
      path.join(import.meta.dirname, '../patterns/chrome/segmented-control.tsx'),
      'utf8',
    );
    const globals = readFileSync(path.join(import.meta.dirname, '../../app/globals.css'), 'utf8');
    expect(editToggle).toContain('hit-area-dense-square');
    expect(chip).toContain('hit-area-dense-square');
    expect(segmented).toContain('hit-area-dense');
    expect(globals).toContain('.hit-area-dense::after');
    expect(globals).toContain('.hit-area-dense-square::after');
  });
});

describe('ADR-0023 remaining viewport 44 slabs (TASK-865)', () => {
  const coreRulesAddRowFiles = [
    '../../app/(main)/admin/core-rules/core-rules-armament-editor.tsx',
    '../../app/(main)/admin/core-rules/core-rules-sizes-editor.tsx',
    '../../app/(main)/admin/core-rules/core-rules-rarities-editor.tsx',
    '../../app/(main)/admin/core-rules/core-rules-ability-skills-editors.tsx',
    '../../app/(main)/admin/core-rules/core-rules-conditions-editor.tsx',
    '../../app/(main)/admin/core-rules/core-rules-crafting-rules-editor.tsx',
  ];

  it('raises core-rules add-row links with touch-tier-standard, not md:min-h-0', () => {
    const fieldEditors = readFileSync(
      path.join(
        import.meta.dirname,
        '../../app/(main)/admin/core-rules/core-rules-field-editors.tsx',
      ),
      'utf8',
    );
    expect(fieldEditors).toContain('CORE_RULES_ADD_ROW_CLASS');
    expect(fieldEditors).toContain('touch-tier-standard');
    expect(fieldEditors).not.toContain('md:min-h-0');
    expect(fieldEditors).not.toMatch(/min-h-\[44px\]/);

    for (const rel of coreRulesAddRowFiles) {
      const src = readFileSync(path.join(import.meta.dirname, rel), 'utf8');
      expect(src).toContain('CORE_RULES_ADD_ROW_CLASS');
      expect(src).not.toContain('md:min-h-0');
      expect(src).not.toMatch(/min-h-\[44px\]/);
    }
  });

  it('raises rulebook nav and chapter prev/next with pointer tiers, not md:min-h-0', () => {
    const nav = readFileSync(path.join(import.meta.dirname, '../rules/rulebook-nav.tsx'), 'utf8');
    const chapter = readFileSync(
      path.join(import.meta.dirname, '../../app/(main)/rules/[slug]/page.tsx'),
      'utf8',
    );
    expect(nav).toContain('touch-tier-standard');
    expect(nav).not.toContain('md:min-h-0');
    expect(nav).not.toMatch(/min-h-\[44px\]/);
    expect(chapter).toContain('touch-tier-standard');
    expect(chapter).not.toContain('md:min-h-0');
    expect(chapter).not.toMatch(/min-h-\[44px\]/);
  });

  it('raises CharacterFilter header with touch-tier-standard, not md:min-h-5', () => {
    const src = readFileSync(
      path.join(import.meta.dirname, '../patterns/filters/character-filter.tsx'),
      'utf8',
    );
    expect(src).toContain('touch-tier-standard');
    expect(src).not.toContain('md:min-h-5');
    expect(src).not.toMatch(/min-h-\[44px\]/);
  });

  it('uses IconButton and touch-tier-standard on Codex spreadsheet hits, not md 36 slabs', () => {
    const src = readFileSync(
      path.join(import.meta.dirname, '../../app/(main)/admin/codex/codex-spreadsheet-table.tsx'),
      'utf8',
    );
    expect(src).toContain('<IconButton');
    expect(src).toContain('touch-tier-standard');
    expect(src).not.toContain('md:min-h-[36px]');
    expect(src).not.toContain('md:min-w-[36px]');
    expect(src).not.toMatch(/min-w-\[44px\]/);
    expect(src).not.toMatch(/min-h-\[44px\]/);
  });
});

describe('ADR-0023 item-creator handedness SegmentedControl (TASK-866)', () => {
  it('uses shared SegmentedControl with pointer-tier default size, not custom min-h 44 buttons', () => {
    const handedness = readFileSync(
      path.join(
        import.meta.dirname,
        '../../app/(main)/item-creator/item-creator-editor-weapon-shield.tsx',
      ),
      'utf8',
    );
    const segmented = readFileSync(
      path.join(import.meta.dirname, '../patterns/chrome/segmented-control.tsx'),
      'utf8',
    );
    expect(handedness).toContain('<SegmentedControl');
    expect(handedness).toContain('One-Handed');
    expect(handedness).toContain('Two-Handed');
    expect(handedness).not.toMatch(/min-h-\[44px\]/);
    expect(handedness).not.toContain('bg-warning-600');
    expect(segmented).toContain('touch-tier-standard');
    expect(segmented).not.toMatch(/min-h-\[44px\]/);
  });
});
