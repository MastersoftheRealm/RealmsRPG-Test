import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  countSourceReadsInTestText,
  diffTestSourceReadRatchet,
  formatTestSourceReadRatchetFailure,
} from './lib/test-source-reads.mjs';
import {
  measureTestSourceReadRatchet,
  runTestSourceReadRatchetCheck,
} from './check-test-source-read-ratchet.mjs';

describe('countSourceReadsInTestText', () => {
  it('counts process.cwd src reads and skips json fixtures', () => {
    const text = `
      readFileSync(path.join(process.cwd(), 'src/app/page.tsx'), 'utf8');
      readFileSync(path.join(process.cwd(), 'tests/fixtures/x.json'), 'utf8');
    `;
    expect(countSourceReadsInTestText(text, 'src/foo.test.ts')).toBe(1);
  });

  it('does not treat the import line as a call (describe body still scanned)', () => {
    const text = `import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import path from 'node:path';

describe('layout', () => {
  it('reads page source', () => {
    readFileSync(path.join(process.cwd(), 'src/app/page.tsx'), 'utf8');
  });
});`;
    expect(countSourceReadsInTestText(text, 'src/foo.test.ts')).toBe(1);
  });

  it('counts new URL reads from colocated tests', () => {
    const text = `readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');`;
    expect(countSourceReadsInTestText(text, 'src/app/page.test.ts')).toBe(1);
  });

  it('counts readFile from fs/promises', () => {
    const text = `import { readFile } from 'fs/promises';
await readFile(path.join(process.cwd(), 'src/app/page.tsx'), 'utf8');`;
    expect(countSourceReadsInTestText(text, 'src/foo.test.ts')).toBe(1);
  });

  it('counts fs.promises.readFile', () => {
    const text = `import fs from 'node:fs';
await fs.promises.readFile(path.join(process.cwd(), 'src/app/page.tsx'), 'utf8');`;
    expect(countSourceReadsInTestText(text, 'src/foo.test.ts')).toBe(1);
  });

  it('counts fs.readFile', () => {
    const text = `import fs from 'node:fs';
fs.readFile(path.join(process.cwd(), 'src/app/page.tsx'), 'utf8', () => {});`;
    expect(countSourceReadsInTestText(text, 'src/foo.test.ts')).toBe(1);
  });

  it('counts path.join(__dirname, …) reads', () => {
    const text = `readFileSync(path.join(__dirname, '../app/page.tsx'), 'utf8');`;
    expect(countSourceReadsInTestText(text, 'src/app/page.test.ts')).toBe(1);
  });

  it('counts path.resolve(__dirname, …) reads', () => {
    const text = `readFileSync(path.resolve(__dirname, '../app/page.tsx'), 'utf8');`;
    expect(countSourceReadsInTestText(text, 'src/app/page.test.ts')).toBe(1);
  });

  it('counts require.resolve paths under src/', () => {
    const text = `require.resolve('src/app/page.tsx');`;
    expect(countSourceReadsInTestText(text, 'src/foo.test.ts')).toBe(1);
  });

  it('skips committed *-baseline.json paths but not ordinary fixture json under tests/', () => {
    expect(
      countSourceReadsInTestText(
        `readFileSync('tests/visual/a11y-baseline.json', 'utf8');`,
        'src/foo.test.ts',
      ),
    ).toBe(0);
    expect(
      countSourceReadsInTestText(
        `readFileSync(path.join(process.cwd(), 'tests/fixtures/data.json'), 'utf8');`,
        'src/foo.test.ts',
      ),
    ).toBe(0);
  });
});

describe('diffTestSourceReadRatchet', () => {
  it('blocks new test files with reads', () => {
    expect(diffTestSourceReadRatchet({ 'src/a.test.ts': 1 }, {})).toHaveLength(1);
  });

  it('blocks increased reads in existing files', () => {
    expect(diffTestSourceReadRatchet({ 'src/a.test.ts': 2 }, { 'src/a.test.ts': 1 })).toHaveLength(
      1,
    );
  });
});

describe('runTestSourceReadRatchetCheck on fixture tree', () => {
  it('fails before baseline update and passes after', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'source-read-ratchet-'));
    const baselinePath = path.join(dir, 'baseline.json');
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'src', 'layout.test.ts'),
      `import { readFileSync } from 'node:fs';
       readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');`,
    );

    expect(runTestSourceReadRatchetCheck({ baselinePath, update: false, root: dir }).ok).toBe(
      false,
    );
    runTestSourceReadRatchetCheck({ baselinePath, update: true, root: dir });
    expect(runTestSourceReadRatchetCheck({ baselinePath, update: false, root: dir }).ok).toBe(true);

    fs.appendFileSync(
      path.join(dir, 'src', 'layout.test.ts'),
      `readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');`,
    );
    const regressed = runTestSourceReadRatchetCheck({ baselinePath, update: false, root: dir });
    expect(regressed.ok).toBe(false);
    expect(formatTestSourceReadRatchetFailure(regressed.errors)).toMatch(
      /tasks:test-source-read-ratchet:update/,
    );
  });

  it('measureTestSourceReadRatchet returns zero for behavior-only tests', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'source-read-clean-'));
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'src', 'math.test.ts'),
      `import { describe, it, expect } from 'vitest';
       describe('x', () => { it('works', () => expect(1).toBe(1)); });`,
    );
    expect(measureTestSourceReadRatchet(dir)).toEqual({});
  });
});
