import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import {
  columnHasDisplayValue,
  columnHasInteractiveValue,
  columnsAlreadyShowTrainingPoints,
  columnsForExpandedBodyStats,
  columnsForMobileSummary,
  dataColumnTrackCount,
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

  it('omits blank and in-body description from expanded body stats', () => {
    expect(
      columnsForExpandedBodyStats(
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

describe('columnHasInteractiveValue / dataColumnTrackCount (TASK-898)', () => {
  it('detects ReactNode column values that need stacked expanded layout', () => {
    expect(columnHasInteractiveValue({ key: 'uses', value: '1/2' })).toBe(false);
    expect(columnHasInteractiveValue({ key: 'uses', value: createElement('span') })).toBe(true);
  });

  it('sums data column spans for expanded name grid-column span', () => {
    expect(
      dataColumnTrackCount(
        [
          { key: 'description', value: 'x' },
          { key: 'uses', value: '1' },
          { key: 'recovery', value: 'FR' },
        ],
        [3, 1, 1],
      ),
    ).toBe(5);
  });
});
