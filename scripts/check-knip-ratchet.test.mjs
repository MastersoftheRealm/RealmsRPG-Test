import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  countKnipUnusedFromReport,
  diffKnipRatchet,
  formatKnipRatchetFailure,
  runKnipRatchetCheck,
} from './check-knip-ratchet.mjs';

describe('countKnipUnusedFromReport', () => {
  it('sums exports and types arrays on issue entries', () => {
    const measured = countKnipUnusedFromReport({
      issues: {
        0: { exports: [{ name: 'a' }, { name: 'b' }], types: [{ name: 'T' }] },
        1: { exports: [], types: [] },
      },
    });
    expect(measured).toEqual({ unusedExports: 2, unusedTypes: 1 });
  });
});

describe('diffKnipRatchet', () => {
  it('fails when counts rise', () => {
    const errors = diffKnipRatchet(
      { unusedExports: 2, unusedTypes: 1 },
      { unusedExports: 1, unusedTypes: 0 },
    );
    expect(errors).toHaveLength(2);
  });

  it('passes when counts are unchanged', () => {
    expect(
      diffKnipRatchet({ unusedExports: 0, unusedTypes: 0 }, { unusedExports: 0, unusedTypes: 0 }),
    ).toHaveLength(0);
  });

  it('passes when counts drop (baseline may be lowered separately)', () => {
    expect(
      diffKnipRatchet({ unusedExports: 0, unusedTypes: 0 }, { unusedExports: 5, unusedTypes: 3 }),
    ).toHaveLength(0);
  });
});

describe('runKnipRatchetCheck', () => {
  it('fails when baseline file is missing', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'knip-ratchet-'));
    const baselinePath = path.join(dir, 'missing-baseline.json');
    const result = runKnipRatchetCheck({
      baselinePath,
      update: false,
      root: dir,
      measure: () => ({ unusedExports: 0, unusedTypes: 0 }),
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/Missing knip ratchet baseline/);
  });

  it('fails on regression and passes when counts match baseline', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'knip-ratchet-'));
    const baselinePath = path.join(dir, 'baseline.json');
    fs.writeFileSync(baselinePath, JSON.stringify({ unusedExports: 1, unusedTypes: 0 }));

    const regressed = runKnipRatchetCheck({
      baselinePath,
      update: false,
      root: dir,
      measure: () => ({ unusedExports: 2, unusedTypes: 0 }),
    });
    expect(regressed.ok).toBe(false);
    expect(formatKnipRatchetFailure(regressed.errors)).toMatch(/tasks:knip-ratchet:update/);

    const ok = runKnipRatchetCheck({
      baselinePath,
      update: false,
      root: dir,
      measure: () => ({ unusedExports: 1, unusedTypes: 0 }),
    });
    expect(ok.ok).toBe(true);

    const improved = runKnipRatchetCheck({
      baselinePath,
      update: false,
      root: dir,
      measure: () => ({ unusedExports: 0, unusedTypes: 0 }),
    });
    expect(improved.ok).toBe(true);
    expect(improved.belowBaseline).toBe(true);
  });
});
