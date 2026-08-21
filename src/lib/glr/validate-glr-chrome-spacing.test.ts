import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  classListEquals,
  DEFAULT_GLR_LIST_CLASSNAME,
  DEFAULT_USM_LIST_CLASSNAME,
} from './glr-chrome-spacing-norms';
import {
  assertGlrChromeSpacingSources,
  expectedRowChromeFromRowActions,
  resolvedRowChromeFlags,
  scanGlrChromeSpacingSources,
  validateCreatorEmbeddedGlrSource,
  validateGlrGridColumnSource,
  validateGlrListClassName,
  validateMyLibraryEntityTabSource,
  validateCodexBrowseShellSource,
  validateUsmListShellSource,
  validateUsmQuantityChromeSource,
  validateGlrRowLayoutSource,
} from './validate-glr-chrome-spacing';

const repoRoot = path.resolve(__dirname, '../../..');

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('GLR chrome + spacing norms (TASK-631, TASK-637)', () => {
  it('accepts canonical default list class', () => {
    expect(validateGlrListClassName(DEFAULT_GLR_LIST_CLASSNAME, 'test')).toEqual([]);
  });

  it('treats Prettier class-order as the same list contract', () => {
    expect(classListEquals('flex min-w-0 flex-col gap-1', 'flex flex-col gap-1 min-w-0')).toBe(
      true,
    );
    expect(
      validateUsmListShellSource(
        'unified-selection-modal-list.tsx',
        `<div className="flex flex-col gap-1 min-w-0">{filteredItems.map}
         const rowChrome = { externalSelection: true };`,
      ),
    ).toEqual([]);
  });

  it('rejects space-y-3 list overrides', () => {
    const errors = validateGlrListClassName('flex flex-col space-y-3 mt-2', 'test');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('space-y'))).toBe(true);
  });

  it('rejects gap-3 list overrides', () => {
    const errors = validateGlrListClassName('flex flex-col gap-3 mt-2', 'test');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('gap-1') || e.includes('loose'))).toBe(true);
  });

  it('rejects 40px action tracks in shared grid templates', () => {
    const errors = validateGlrGridColumnSource(
      'bad-grid.ts',
      `export const OFFICIAL_POWER_GRID = '1fr 1fr 40px';`,
    );
    expect(errors.some((e) => e.includes('40px'))).toBe(true);
  });

  it('flags library tabs that render edit/delete without rowChrome', () => {
    const bad = `
      <UserLibraryEntityTabShell>
        <GridListRow onEdit={() => {}} onDelete={() => {}} />
      </UserLibraryEntityTabShell>
    `;
    const errors = validateMyLibraryEntityTabSource('LibraryBadTab.tsx', bad);
    expect(errors.some((e) => e.includes('rowChrome'))).toBe(true);
  });

  it('flags library tabs with rightSlot but missing rowChrome.rightSlot', () => {
    const bad = `
      const POWER_ROW_CHROME = { edit: true, delete: true } as const;
      <UserLibraryEntityTabShell rowChrome={POWER_ROW_CHROME}>
        <GridListRow onEdit={() => {}} onDelete={() => {}} rightSlot={<span />} />
      </UserLibraryEntityTabShell>
    `;
    const errors = validateMyLibraryEntityTabSource('LibraryBadTab.tsx', bad);
    expect(errors.some((e) => e.includes('rightSlot'))).toBe(true);
  });

  it('accepts library tabs with full ROW_CHROME const', () => {
    const good = `
      const POWER_ROW_CHROME = { edit: true, delete: true, rightSlot: true } as const;
      <UserLibraryEntityTabShell rowChrome={POWER_ROW_CHROME}>
        <GridListRow rowChrome={POWER_ROW_CHROME} onEdit={() => {}} onDelete={() => {}} rightSlot={<span />} />
      </UserLibraryEntityTabShell>
    `;
    expect(validateMyLibraryEntityTabSource('LibraryPowersTab.tsx', good)).toEqual([]);
  });

  it('flags conditional rightSlot without GridListRow rowChrome', () => {
    const bad = `
      const POWER_ROW_CHROME = { edit: true, delete: true, rightSlot: true } as const;
      <UserLibraryEntityTabShell rowChrome={POWER_ROW_CHROME}>
        <GridListRow onEdit={() => {}} onDelete={() => {}} rightSlot={hasDrift ? <span /> : undefined} />
      </UserLibraryEntityTabShell>
    `;
    const errors = validateMyLibraryEntityTabSource('LibraryBadTab.tsx', bad);
    expect(errors.some((e) => e.includes('conditional rightSlot'))).toBe(true);
  });

  it('parses expected vs actual rowChrome flags', () => {
    const source = `
      const X = { edit: true, delete: true, rightSlot: true } as const;
      <Shell rowChrome={X}><GridListRow onEdit={() => {}} rightSlot={x} /></Shell>
    `;
    expect(expectedRowChromeFromRowActions(source)).toEqual({
      edit: true,
      delete: false,
      leftSlot: false,
      rightSlot: true,
    });
    expect(resolvedRowChromeFlags(source)).toEqual({
      edit: true,
      delete: true,
      leftSlot: false,
      rightSlot: true,
    });
  });

  it('does not treat AdminCodexRowActions onEdit as GridListRow edit chrome', () => {
    const source = `
      <CodexBrowseListShell rowChrome={{ rightSlot: true }}>
        <GridListRow
          rightSlot={
            <AdminCodexRowActions onEdit={openEdit} onDelete={askDelete} />
          }
        />
      </CodexBrowseListShell>
    `;
    expect(expectedRowChromeFromRowActions(source)).toEqual({
      edit: false,
      delete: false,
      leftSlot: false,
      rightSlot: true,
    });
    expect(validateCodexBrowseShellSource('AdminPartsTab.tsx', source)).toEqual([]);
  });

  it('flags creator embedded lists with 40px action tracks', () => {
    const errors = validateGlrGridColumnSource(
      'creature-creator-editor-loadout-sections.tsx',
      `const CREATURE_FEAT_LIST_GRID = '1fr 40px';`,
    );
    expect(errors.some((e) => e.includes('40px'))).toBe(true);
  });

  it('flags embedded ListHeader blocks missing rowChrome.rightSlot', () => {
    const bad = `
      <ListHeader columns={[]} />
      <GridListRow rightSlot={<button />} />
    `;
    const errors = validateCreatorEmbeddedGlrSource('bad.tsx', bad);
    expect(errors.some((e) => e.includes('rowChrome'))).toBe(true);
  });

  it('rejects non-canonical USM list row container', () => {
    const errors = validateUsmListShellSource(
      'unified-selection-modal-list.tsx',
      `<div className="space-y-1 min-w-0">{filteredItems.map`,
    );
    expect(errors.some((e) => e.includes(DEFAULT_USM_LIST_CLASSNAME))).toBe(true);
  });

  it('flags USM list that still appends an inline selection track', () => {
    const errors = validateUsmListShellSource(
      'unified-selection-modal-list.tsx',
      `<div className="${DEFAULT_USM_LIST_CLASSNAME}">{filteredItems.map(item => gridColumnsWithInlineSelection(gridColumns)`,
    );
    expect(
      errors.some((e) => e.includes('externalSelection') || e.includes('inline selection')),
    ).toBe(true);
  });

  it('flags quantity chrome missing matching rightSlotWidth on header+row', () => {
    const errors = validateUsmQuantityChromeSource(
      'guided-inline-catalog-list.tsx',
      `<ListHeader rightSlotWidth={RIGHT_SLOT_WIDTH} /><GridListRow rightSlot={<Qty />} />`,
    );
    expect(errors.some((e) => e.includes('USM_QUANTITY_RIGHT_SLOT_WIDTH'))).toBe(true);
  });

  it('flags GridListRow chrome pinned with items-start / self-start', () => {
    const errors = validateGlrRowLayoutSource(
      'grid-list-row.tsx',
      `<div className={cn('flex items-start', hoverClass)}>`,
    );
    expect(errors.some((e) => e.includes('items-start') || e.includes('items-stretch'))).toBe(true);
  });

  it('accepts stretch-grid GridListRow layout with shared expanded band', () => {
    expect(
      validateGlrRowLayoutSource(
        'grid-list-row.tsx',
        `<div data-glr-row className={cn('grid items-stretch', hoverClass)}>
           <div className={GRID_LIST_ROW_EXPANDED_BAND_CLASS} />`,
      ),
    ).toEqual([]);
  });

  it('accepts quantity chrome when header and row share USM_QUANTITY_RIGHT_SLOT_WIDTH', () => {
    expect(
      validateUsmQuantityChromeSource(
        'unified-selection-modal-list.tsx',
        `<ListHeader rightSlotWidth={showQuantity ? USM_QUANTITY_RIGHT_SLOT_WIDTH : undefined} />
         <GridListRow rightSlotWidth={showQuantity ? USM_QUANTITY_RIGHT_SLOT_WIDTH : undefined} />`,
      ),
    ).toEqual([]);
  });

  it('registered GLR shells and browse lists satisfy chrome + spacing contract', () => {
    const { errors } = scanGlrChromeSpacingSources(readRepoFile);
    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
    expect(errors).toEqual([]);
  });

  it('assert helper passes on repo sources', () => {
    expect(() => assertGlrChromeSpacingSources(readRepoFile)).not.toThrow();
  });
});
