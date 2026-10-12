import { describe, expect, it } from 'vitest';
import { COMBAT_ENCOUNTER_LAYOUT_CLASS } from './combat-encounter-layout';

describe('combat encounter layout (86e3k91a8)', () => {
  it('gives the add-combatant rail at least 16rem from lg', () => {
    expect(COMBAT_ENCOUNTER_LAYOUT_CLASS).toContain('minmax(16rem,22rem)');
    expect(COMBAT_ENCOUNTER_LAYOUT_CLASS).not.toContain('grid-cols-4');
  });
});
