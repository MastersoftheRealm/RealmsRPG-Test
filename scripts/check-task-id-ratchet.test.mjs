import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  countKeepInSyncCommentLines,
  countTaskIdTagsInText,
  diffTaskIdRatchet,
  formatTaskIdRatchetFailure,
} from './lib/task-id-tags.mjs';
import { measureTaskIdRatchet, runTaskIdRatchetCheck } from './check-task-id-ratchet.mjs';

describe('countTaskIdTagsInText', () => {
  it('counts TASK and ClickUp legacy ids', () => {
    const { byPattern, total } = countTaskIdTagsInText('// TASK-616 and 86e3jxgxb');
    expect(byPattern.taskNumeric).toBe(1);
    expect(byPattern.clickupLegacy).toBe(1);
    expect(total).toBe(2);
  });

  it('counts keep in sync only in comments', () => {
    expect(countKeepInSyncCommentLines('const x = "keep in sync";')).toBe(0);
    expect(countKeepInSyncCommentLines('* keep in sync with CSS')).toBe(1);
  });
});

describe('diffTaskIdRatchet', () => {
  it('fails when a pattern count increases', () => {
    const baseline = { 'src/a.ts': { taskNumeric: 1 } };
    const measured = { 'src/a.ts': { taskNumeric: 2 } };
    expect(diffTaskIdRatchet(measured, baseline)).toHaveLength(1);
  });

  it('passes when counts drop', () => {
    const baseline = { 'src/a.ts': { taskNumeric: 2 } };
    const measured = { 'src/a.ts': { taskNumeric: 1 } };
    expect(diffTaskIdRatchet(measured, baseline)).toHaveLength(0);
  });

  it('fails for new files with tags', () => {
    const errors = diffTaskIdRatchet({ 'src/new.ts': { taskNumeric: 1 } }, {});
    expect(errors[0]).toMatch(/new file/);
  });
});

describe('runTaskIdRatchetCheck on fixture tree', () => {
  it('fails before baseline update and passes after', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'task-id-ratchet-'));
    const baselinePath = path.join(dir, 'baseline.json');
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'a.ts'), '// TASK-1\n');

    const before = runTaskIdRatchetCheck({ baselinePath, update: false, root: dir });
    expect(before.ok).toBe(false);

    runTaskIdRatchetCheck({ baselinePath, update: true, root: dir });
    const after = runTaskIdRatchetCheck({ baselinePath, update: false, root: dir });
    expect(after.ok).toBe(true);

    fs.writeFileSync(path.join(dir, 'src', 'a.ts'), '// TASK-1\n// TASK-2\n');
    const regressed = runTaskIdRatchetCheck({ baselinePath, update: false, root: dir });
    expect(regressed.ok).toBe(false);
    expect(formatTaskIdRatchetFailure(regressed.errors)).toMatch(/tasks:task-id-ratchet:update/);
  });

  it('measureTaskIdRatchet ignores markdown and test files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'task-id-scope-'));
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'note.md'), 'TASK-999');
    fs.writeFileSync(path.join(dir, 'src', 'x.test.ts'), 'TASK-999');
    fs.writeFileSync(path.join(dir, 'src', 'ok.ts'), '// TASK-1');
    expect(measureTaskIdRatchet(dir)).toEqual({ 'src/ok.ts': { taskNumeric: 1 } });
  });
});
