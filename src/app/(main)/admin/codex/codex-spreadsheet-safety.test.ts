/**
 * Spreadsheet safety rails: ids stay out of find/replace and out of the editable grid,
 * and the save confirmation reports what actually changed rather than a bare row count.
 */

import { describe, expect, it } from 'vitest';
import { READONLY_COLUMNS, searchableColumns } from './codex-spreadsheet-config';
import { changedColumns, generateNextNumericId } from './codex-spreadsheet-helpers';

describe('find/replace column scope', () => {
  it('never offers the id column, so Replace all cannot retarget a row', () => {
    const columns = ['id', 'name', 'description', 'category'];

    expect(searchableColumns(columns)).toEqual(['name', 'description', 'category']);
  });

  it('marks id read-only in the grid', () => {
    expect(READONLY_COLUMNS.has('id')).toBe(true);
  });
});

describe('changedColumns', () => {
  it('lists only the cells that differ from the loaded row', () => {
    const original = { id: '1', name: 'Blade', base_en: 3, tags: 'melee' };
    const current = { id: '99', name: 'Blade', base_en: 5, tags: 'melee' };

    expect(changedColumns(current, original)).toEqual(['base_en']);
  });

  it('treats a row with no snapshot as entirely new', () => {
    expect(changedColumns({ id: '__new', name: 'Draft' }, null)).toEqual(['name']);
  });
});

describe('generateNextNumericId', () => {
  it('proposes an id above every loaded row', () => {
    expect(generateNextNumericId(new Set(['1', '2', '7']))).toBe('8');
  });
});
