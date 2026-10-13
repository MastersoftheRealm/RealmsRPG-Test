import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const rulesPath = path.join(import.meta.dirname, 'GAME_RULES.md');
const combatChapterPath = path.join(
  import.meta.dirname,
  '../content/rules/combat-encounters.mdx',
);

describe('GAME_RULES Multiple Action Penalty (86e3pmgnw)', () => {
  it('matches Core Rulebook scope (D20 rolls; Basic/Quick/Free same action type)', () => {
    const rules = readFileSync(rulesPath, 'utf8');
    const rulebook = readFileSync(combatChapterPath, 'utf8');
    expect(rules).toContain('involves a D20 roll');
    expect(rules).toContain('all related D20 rolls');
    expect(rules).toMatch(/Basic, Quick, and Free Actions or Reactions/);
    expect(rulebook).toContain('involves a D20 roll');
    expect(rulebook).toMatch(/Basic, Quick, and Free Actions or Reactions/);
  });
});
