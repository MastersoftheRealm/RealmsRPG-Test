import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOTS = ['src', 'public'].map((dir) => path.join(process.cwd(), dir));
const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mdx']);
const marker = '[' + 'Placeholder';

function listSourceFiles(dir: string): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return [];
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...listSourceFiles(full));
    } else if (SOURCE_EXT.has(path.extname(name))) {
      files.push(full);
    }
  }
  return files;
}

/** Keep string and JSX text. Drop comments, where a wording note is allowed. */
function stripComments(source: string): string {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const c = source[i] ?? '';
    const next = source[i + 1] ?? '';
    if (c === '/' && next === '/') {
      i += 2;
      while (i < source.length && source[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      out += c;
      i += 1;
      while (i < source.length) {
        const ch = source[i] ?? '';
        if (ch === '\\') {
          out += ch + (source[i + 1] ?? '');
          i += 2;
          continue;
        }
        out += ch;
        i += 1;
        if (ch === c) break;
      }
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

describe('visible placeholder prefix', () => {
  it('rejects non-comment source that contains the bracketed placeholder prefix', () => {
    const hits: string[] = [];
    for (const root of ROOTS) {
      for (const file of listSourceFiles(root)) {
        const stripped = stripComments(readFileSync(file, 'utf8'));
        if (stripped.includes(marker)) {
          hits.push(path.relative(process.cwd(), file));
        }
      }
    }
    expect(hits).toEqual([]);
  });
});
