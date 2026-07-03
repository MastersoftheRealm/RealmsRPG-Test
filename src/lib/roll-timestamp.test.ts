import { describe, expect, it } from 'vitest';
import { formatRollTimestamp, normalizeRollTimestamp } from './roll-timestamp';

describe('roll timestamp compatibility', () => {
  it('parses ISO strings from current API serialization', () => {
    const iso = '2026-03-15T14:30:00.000Z';
    const d = normalizeRollTimestamp(iso);
    expect(d.toISOString()).toBe(iso);
  });

  it('parses legacy Firestore { seconds } payloads', () => {
    const legacy = { seconds: 1_700_000_000, nanoseconds: 500_000_000 };
    const d = normalizeRollTimestamp(legacy);
    expect(d.getTime()).toBe(1_700_000_000_000);
  });

  it('accepts Date instances unchanged', () => {
    const d = new Date('2026-01-01T12:00:00.000Z');
    expect(normalizeRollTimestamp(d)).toBe(d);
  });

  it('formatRollTimestamp never returns empty for valid inputs', () => {
    expect(formatRollTimestamp('2026-06-01T10:00:00.000Z')).not.toBe('-');
    expect(formatRollTimestamp({ seconds: 1_700_000_000 })).not.toBe('-');
  });

  it('formatRollTimestamp returns dash for invalid dates', () => {
    expect(formatRollTimestamp('not-a-date')).toBe('-');
  });
});
