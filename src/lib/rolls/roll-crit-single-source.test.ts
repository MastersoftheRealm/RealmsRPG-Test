import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Fails on master where roll-context / roll-log duplicate nat-20 math.
 * Passes once every client path delegates to computeRollOutcome in die.ts.
 */
describe('roll crit logic single source (PR 503 P2)', () => {
  const repoRoot = path.resolve(import.meta.dirname, '../../..');

  const clientRollSources = [
    'src/components/rolls/roll-context.tsx',
    'src/components/rolls/roll-log.tsx',
  ];

  it('does not inline nat-20 crit totals in client roll components', () => {
    for (const relative of clientRollSources) {
      const source = readFileSync(path.join(repoRoot, relative), 'utf8');
      expect(source, relative).not.toMatch(/\broll === 20\b/);
      expect(source, relative).not.toMatch(/\btotal \+= 2\b/);
      expect(source, relative).not.toMatch(/\btotal -= 2\b/);
      expect(source, relative).not.toMatch(/\bd20CritAdjustment\b/);
      expect(source, relative).toMatch(/\bcomputeRollOutcome\b/);
    }
  });
});
