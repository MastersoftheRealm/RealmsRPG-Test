import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SPREADSHEET_ESTIMATED_ROW_HEIGHT,
  SPREADSHEET_VIRTUALIZE_ROW_THRESHOLD,
} from './codex-spreadsheet-virtualization';

const dir = import.meta.dirname;

describe('admin codex spreadsheet virtualization (86e3meznt)', () => {
  it('matches CodexBrowseListShell row threshold', () => {
    expect(SPREADSHEET_VIRTUALIZE_ROW_THRESHOLD).toBe(40);
    expect(SPREADSHEET_ESTIMATED_ROW_HEIGHT).toBeGreaterThan(0);
  });

  it('virtualizes large grids inside the scroll container', () => {
    const table = readFileSync(path.join(dir, 'codex-spreadsheet-table.tsx'), 'utf8');
    expect(table).toContain('useVirtualizer');
    expect(table).toContain('SPREADSHEET_VIRTUALIZE_ROW_THRESHOLD');
    expect(table).toContain('CodexSpreadsheetTableRow');
  });
});
