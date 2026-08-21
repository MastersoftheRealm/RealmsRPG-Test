import { describe, expect, it } from 'vitest';
import {
  formatCreatureLevel,
  formatCreatureLevelLabel,
  formatCreatureLevelShort,
  parseCreatureLevelSortValue,
} from './creature-level-display';

describe('formatCreatureLevel', () => {
  it('renders sub-1 quarter levels as unicode fractions', () => {
    expect(formatCreatureLevel(0.25)).toBe('¼');
    expect(formatCreatureLevel(0.5)).toBe('½');
    expect(formatCreatureLevel(0.75)).toBe('¾');
  });

  it('renders mixed whole + quarter levels', () => {
    expect(formatCreatureLevel(1.25)).toBe('1¼');
    expect(formatCreatureLevel(2.5)).toBe('2½');
    expect(formatCreatureLevel(3.75)).toBe('3¾');
  });

  it('renders integer levels unchanged', () => {
    expect(formatCreatureLevel(1)).toBe('1');
    expect(formatCreatureLevel(10)).toBe('10');
  });

  it('tolerates string input and floating-point noise', () => {
    expect(formatCreatureLevel('0.5')).toBe('½');
    expect(formatCreatureLevel(0.30000000004)).toBe('¼');
  });

  it('returns dash for invalid values', () => {
    expect(formatCreatureLevel(null)).toBe('-');
    expect(formatCreatureLevel(undefined)).toBe('-');
    expect(formatCreatureLevel(-1)).toBe('-');
  });
});

describe('formatCreatureLevelLabel', () => {
  it('prefixes with Level', () => {
    expect(formatCreatureLevelLabel(0.25)).toBe('Level ¼');
    expect(formatCreatureLevelLabel(3)).toBe('Level 3');
  });
});

describe('formatCreatureLevelShort', () => {
  it('prefixes with Lv', () => {
    expect(formatCreatureLevelShort(0.5)).toBe('Lv ½');
    expect(formatCreatureLevelShort(2)).toBe('Lv 2');
  });
});

describe('parseCreatureLevelSortValue', () => {
  it('orders quarter-step numeric levels for sort', () => {
    const levels = [1, 0.5, 0.25, 0.75, 2.25];
    const sorted = [...levels].sort(
      (a, b) => parseCreatureLevelSortValue(a)! - parseCreatureLevelSortValue(b)!,
    );
    expect(sorted).toEqual([0.25, 0.5, 0.75, 1, 2.25]);
  });

  it('parses display strings from formatCreatureLevel', () => {
    expect(parseCreatureLevelSortValue(formatCreatureLevel(0.25))).toBe(0.25);
    expect(parseCreatureLevelSortValue(formatCreatureLevel(0.5))).toBe(0.5);
    expect(parseCreatureLevelSortValue(formatCreatureLevel(1.25))).toBe(1.25);
  });

  it('returns null for invalid values', () => {
    expect(parseCreatureLevelSortValue(null)).toBeNull();
    expect(parseCreatureLevelSortValue('-')).toBeNull();
    expect(parseCreatureLevelSortValue('foo')).toBeNull();
  });
});
