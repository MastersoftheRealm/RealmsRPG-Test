import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(path.join(import.meta.dirname, 'ability-score-editor.tsx'), 'utf8');

describe('AbilityScoreEditor compact layout (TASK-828)', () => {
  it('uses an honest 2/3/6 column grid and Dense steppers when compact', () => {
    expect(source).toMatch(/grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6/);
    expect(source).not.toMatch(/compact \? 'grid-cols-3 md:grid-cols-6'/);
    expect(source).toMatch(/size=\{compact \? 'sm' : 'md'\}/);
    expect(source).toMatch(/compact \? 'min-w-\[2\.25rem\] text-xl' : 'min-w-\[3rem\] text-2xl'/);
  });
});
