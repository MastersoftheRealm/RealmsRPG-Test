import { describe, expect, it } from 'vitest';
import { ABILITIES_AND_DEFENSES, DEFENSE_DISPLAY_NAMES } from '@/lib/game/constants';
import { ABILITY_INFO, DEFENSE_INFO } from './abilities-section-model';

describe('Sheet ability/defense tile labels (TASK-835)', () => {
  it('uses GAME_RULES full names from ABILITIES_AND_DEFENSES (no Mental Fort.)', () => {
    const defenseNames = Object.values(DEFENSE_INFO).map((info) => info.name);
    const abilityNames = Object.values(ABILITY_INFO).map((info) => info.name);
    expect([...abilityNames, ...defenseNames]).toEqual([...ABILITIES_AND_DEFENSES]);
    expect(DEFENSE_DISPLAY_NAMES.reflex).toBe('Reflexes');
    expect(DEFENSE_DISPLAY_NAMES.mentalFortitude).toBe('Mental Fortitude');
    expect(defenseNames.join(' ')).not.toMatch(/Fort\./);
  });
});
