import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import {
  collapsedColumnOverflowClass,
  columnHasDisplayValue,
  columnHasInteractiveValue,
  columnsAlreadyShowTrainingPoints,
  columnsForMobileSummary,
  columnsWithoutDescriptionPreview,
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

describe('columnHasDisplayValue / mobile expand facts (TASK-868 / TASK-909)', () => {
  it('treats empty, dash, and none as not displayable', () => {
    expect(columnHasDisplayValue({ key: 'uses', value: '-' })).toBe(false);
    expect(columnHasDisplayValue({ key: 'uses', value: '—' })).toBe(false);
    expect(columnHasDisplayValue({ key: 'uses', value: '' })).toBe(false);
    expect(columnHasDisplayValue({ key: 'recovery', value: 'none' })).toBe(false);
    expect(columnHasDisplayValue({ key: 'uses', value: '1/2' })).toBe(true);
    expect(columnHasDisplayValue({ key: 'recovery', value: 'FR' })).toBe(true);
  });

  it('keeps Duration on the mobile summary when it is past the first three columns (86e3kfkca)', () => {
    expect(
      columnsForMobileSummary([
        { key: 'action', value: 'Basic' },
        { key: 'damage', value: '1d8 Ice' },
        { key: 'area', value: 'Sphere 2' },
        { key: 'duration', value: '2 Rounds / 1 Minute' },
      ]).map((col) => col.key),
    ).toEqual(['action', 'damage', 'area', 'duration']);
  });

  it('keeps Damage on the mobile summary when stat-block order puts it past the first three', () => {
    expect(
      columnsForMobileSummary([
        { key: 'energy', value: 8 },
        { key: 'action', value: 'Basic' },
        { key: 'duration', value: 'Instant' },
        { key: 'area', value: '—' },
        { key: 'damage', value: '1d10 Fire' },
      ]).map((col) => col.key),
    ).toEqual(['energy', 'action', 'duration', 'damage']);
  });

  it('omits blank columns from the mobile summary', () => {
    expect(
      columnsForMobileSummary([
        { key: 'uses', value: '-', hideOnMobile: true },
        { key: 'recovery', value: 'FR', hideOnMobile: true },
        { key: 'description', value: 'A feat.', hideOnMobile: true },
      ]).map((col) => col.key),
    ).toEqual(['recovery']);
  });

  it('drops truncated description from header/summary when the body owns it', () => {
    expect(
      columnsWithoutDescriptionPreview(
        [
          { key: 'description', value: 'A feat.' },
          { key: 'uses', value: '1/2' },
          { key: 'recovery', value: 'PR' },
        ],
        true,
      ).map((col) => col.key),
    ).toEqual(['uses', 'recovery']);
  });
});

describe('interactive header cells (TASK-909)', () => {
  it('detects ReactNode column values that must not truncate', () => {
    expect(columnHasInteractiveValue({ key: 'uses', value: '1/2' })).toBe(false);
    expect(columnHasInteractiveValue({ key: 'uses', value: createElement('span') })).toBe(true);
  });

  it('skips text truncate on interactive header cells', () => {
    expect(collapsedColumnOverflowClass({ key: 'action', value: 'Basic' })).toContain('truncate');
    expect(
      collapsedColumnOverflowClass({ key: 'uses', value: createElement('span') }),
    ).not.toContain('truncate');
  });

  it('sums data column spans for description-only name grid-column span', () => {
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
