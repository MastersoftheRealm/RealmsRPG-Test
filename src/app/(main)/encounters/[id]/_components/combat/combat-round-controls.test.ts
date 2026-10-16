import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const controls = readFileSync(new URL('./combat-round-controls.tsx', import.meta.url), 'utf8');

describe('combat round controls chrome (86e3p800n)', () => {
  it('shows per-encounter round label and End Encounter copy', () => {
    expect(controls).toContain('Round {encounter.round}');
    expect(controls).toContain('End Encounter');
    expect(controls).not.toContain('End Combat');
  });

  it('documents Reset All and Clear All via title tooltips', () => {
    expect(controls).toContain('title="Restore full HP, energy, and AP');
    expect(controls).toContain('title="Remove every combatant from this encounter');
  });
});
