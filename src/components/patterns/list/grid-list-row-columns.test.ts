import { describe, expect, it } from 'vitest';
import {
  columnHasDisplayValue,
  columnsAlreadyShowTrainingPoints,
  columnsForExpandedMobileStats,
  columnsForMobileSummary,
} from './grid-list-row-columns';

describe('columnsAlreadyShowTrainingPoints', () => {
  it('detects TP / Training Points column keys and labels', () => {
    expect(columnsAlreadyShowTrainingPoints([{ key: 'TP', value: 3 }])).toBe(true);
    expect(columnsAlreadyShowTrainingPoints([{ key: 'energy', label: 'TP', value: 1 }])).toBe(true);
    expect(
      columnsAlreadyShowTrainingPoints([{ key: 'cost', label: 'Training Points', value: 2 }], 'TP'),
    ).toBe(true);
  });

  it('returns false when no TP column is present', () => {
    expect(
      columnsAlreadyShowTrainingPoints([
        { key: 'Energy', value: 4 },
        { key: 'Action', value: 'Basic Action' },
      ]),
    ).toBe(false);
  });
});

describe('columnHasDisplayValue / mobile expand facts (TASK-868)', () => {
  it('treats empty, dash, and none as not displayable', () => {
    expect(columnHasDisplayValue({ key: 'uses', value: '-' })).toBe(false);
    expect(columnHasDisplayValue({ key: 'uses', value: '—' })).toBe(false);
    expect(columnHasDisplayValue({ key: 'uses', value: '' })).toBe(false);
    expect(columnHasDisplayValue({ key: 'recovery', value: 'none' })).toBe(false);
    expect(columnHasDisplayValue({ key: 'uses', value: '1/2' })).toBe(true);
    expect(columnHasDisplayValue({ key: 'recovery', value: 'FR' })).toBe(true);
  });

  it('omits blank columns from the mobile summary', () => {
    expect(
      columnsForMobileSummary([
        { key: 'uses', value: '-', hideOnMobile: true },
        { key: 'recovery', value: 'FR', hideOnMobile: true },
        { key: 'description', value: 'A feat.', hideOnMobile: true },
      ]).map((col) => col.key),
    ).toEqual(['recovery', 'description']);
  });

  it('omits blank and in-body description from expanded mobile stats', () => {
    expect(
      columnsForExpandedMobileStats(
        [
          { key: 'description', value: 'A feat.' },
          { key: 'uses', value: '-' },
          { key: 'recovery', value: 'PR' },
        ],
        true,
      ).map((col) => col.key),
    ).toEqual(['recovery']);
  });
});
