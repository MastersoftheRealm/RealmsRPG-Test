import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./skill-row.tsx', import.meta.url), 'utf8');

describe('SkillRow stepper focus', () => {
  it('does not remount the stepper when proficiency flips', () => {
    expect(source).not.toMatch(/key=\{proficient/);
    const openings = source.match(/<ValueStepper[\s\S]*?\/>/g) ?? [];
    expect(openings.length).toBeGreaterThan(0);
    for (const opening of openings) {
      expect(opening).not.toContain('key=');
    }
  });
});
