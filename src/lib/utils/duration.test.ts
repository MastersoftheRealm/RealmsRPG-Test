import { describe, expect, it } from 'vitest';
import {
  formatDurationCompact,
  formatDurationDisplay,
  formatDurationFromTypeAndValue,
  formatDurationWithModifiers,
} from './duration';

describe('formatDurationFromTypeAndValue', () => {
  it('pluralizes structured units', () => {
    expect(formatDurationFromTypeAndValue('minutes', 1)).toBe('1 Minute');
    expect(formatDurationFromTypeAndValue('minutes', 10)).toBe('10 Minutes');
    expect(formatDurationFromTypeAndValue('rounds', 2)).toBe('2 Rounds');
    expect(formatDurationFromTypeAndValue('instant', 0)).toBe('Instant');
    expect(formatDurationFromTypeAndValue('permanent', 0)).toBe('Permanent');
  });
});

describe('formatDurationWithModifiers', () => {
  it('appends Focus and Sustain', () => {
    expect(
      formatDurationWithModifiers('minutes', 10, { focus: true, sustain: 2 })
    ).toBe('10 Minutes (Focus) (Sustain 2)');
  });
});

describe('formatDurationDisplay', () => {
  it('handles empty and string inputs', () => {
    expect(formatDurationDisplay(null)).toBe('-');
    expect(formatDurationDisplay(undefined)).toBe('-');
    expect(formatDurationDisplay('')).toBe('-');
    expect(formatDurationDisplay(' 1 Minute ')).toBe('1 Minute');
  });

  it('formats structured objects via the shared layer', () => {
    expect(formatDurationDisplay({ type: 'minutes', value: 10 })).toBe('10 Minutes');
    expect(formatDurationDisplay({ type: 'rounds', value: 1, focus: true })).toBe(
      '1 Round (Focus)'
    );
    expect(formatDurationDisplay({ value: 6, unit: 'hours' })).toBe('6 Hours');
  });
});

describe('formatDurationCompact', () => {
  it('abbreviates known duration strings for list columns', () => {
    expect(formatDurationCompact(undefined)).toBe('-');
    expect(formatDurationCompact('Instant')).toBe('Instant');
    expect(formatDurationCompact('10 Minutes')).toBe('10 MIN');
    expect(formatDurationCompact('2 Rounds')).toBe('2 RNDS');
    expect(formatDurationCompact('1 Hour')).toBe('1 HR');
    expect(formatDurationCompact('Concentration')).toBe('Conc.');
  });
});
