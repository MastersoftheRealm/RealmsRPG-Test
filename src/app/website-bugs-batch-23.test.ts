import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const rollLog = readFileSync(new URL('../components/rolls/roll-log.tsx', import.meta.url), 'utf8');
const rollContext = readFileSync(
  new URL('../components/rolls/roll-context.tsx', import.meta.url),
  'utf8',
);
const archetypeSection = readFileSync(
  new URL('../components/character-sheet/archetype-section.tsx', import.meta.url),
  'utf8',
);

describe('website bugs batch 23 — roll log & unarmed damage', () => {
  it('keeps the roll log dock header and entries within narrow widths (86e3jwawd)', () => {
    expect(rollLog).toContain('flex min-w-0 flex-wrap items-center justify-between gap-2');
    expect(rollLog).toContain('min-w-0 flex-1');
    expect(rollLog).toMatch(
      /w-\[min\(22\.5rem,calc\(100svw-2\*var\(--dock-gap\)\)\)\][^\n]*min-w-0/,
    );
    expect(rollLog).toContain('flex min-w-0 flex-col gap-1 sm:flex-row');
    expect(rollLog).toContain('flex min-w-0 flex-wrap items-center gap-1.5');
  });

  it('warns when campaign roll sync hits the per-minute limit (86e3jwawc)', () => {
    expect(rollContext).toContain('AUTH_RATE_LIMIT_MESSAGE');
    expect(rollContext).toMatch(/err\.status === 429[\s\S]*showToast/);
  });

  it('rolls unarmed damage without a dangling dice row (86e3jwaw8 / 86e3jwaw5)', () => {
    expect(rollContext).toMatch(/diceResults\.length === 0 && totalBonus === 0/);
    expect(rollLog).toContain('const hasDice = roll.dice.length > 0');
    expect(rollLog).toMatch(/\{hasDice &&/);
    expect(archetypeSection).not.toContain('0d4 Bludgeoning');
    expect(archetypeSection).toContain("'Bludgeoning'");
    expect(archetypeSection).toContain("'Unarmed Prowess damage'");
  });
});
