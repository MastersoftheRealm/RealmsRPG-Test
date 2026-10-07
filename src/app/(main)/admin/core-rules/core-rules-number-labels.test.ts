import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = import.meta.dirname;
const editors = readFileSync(path.join(dir, 'core-rules-field-editors.tsx'), 'utf8');

function openingTags(source: string, tag: string): string[] {
  const out: string[] = [];
  const needle = `<${tag}`;
  let i = 0;
  while ((i = source.indexOf(needle, i)) !== -1) {
    let depth = 0;
    let j = i + needle.length;
    for (; j < source.length; j++) {
      const ch = source[j];
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      else if (ch === '>' && depth === 0) {
        j += 1;
        break;
      }
    }
    out.push(source.slice(i, j));
    i = j;
  }
  return out;
}

describe('Admin core rules number labels (86e3k0cgu)', () => {
  it('ties each FieldRow label to its number input', () => {
    expect(editors).toMatch(/htmlFor=\{id\}/);
    expect(editors).toMatch(/React\.cloneElement\([\s\S]*\{ id \}/);
    expect(editors).toMatch(/id=\{id\}/);
    expect(editors).toMatch(/aria-label=\{label\}/);
  });

  it('names every number input that sits outside a FieldRow', () => {
    const files = readdirSync(dir).filter(
      (name) => name.endsWith('.tsx') && name !== 'core-rules-field-editors.tsx',
    );
    for (const name of files) {
      const source = readFileSync(path.join(dir, name), 'utf8');
      const outsideFieldRows = source.replace(/<FieldRow\b[\s\S]*?<\/FieldRow>/g, '');
      for (const block of openingTags(outsideFieldRows, 'NumInput')) {
        expect(block, `${name} NumInput`).toMatch(/\blabel=/);
      }
      for (const block of openingTags(outsideFieldRows, 'input')) {
        if (!block.includes('type="number"')) continue;
        expect(block, `${name} number input`).toMatch(/aria-label=/);
      }
    }
  });
});
