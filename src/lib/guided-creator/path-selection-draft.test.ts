import { describe, expect, it } from 'vitest';
import { buildPathSelectionDraftPatch } from './path-selection-draft';
import { CHARACTER_STARTING_CURRENCY } from '@/stores/character-creator-store';
import { DEFAULT_ABILITIES, type Archetype } from '@/types';

function path(partial: Partial<Archetype> & { id: string }): Archetype {
  return {
    name: 'Test Path',
    type: 'power',
    ...partial,
  };
}

describe('buildPathSelectionDraftPatch', () => {
  it('same-path re-select retains dependents (only path identity + ability fields)', () => {
    const selected = path({
      id: 'path-a',
      type: 'power',
      archetype_ability: 'intelligence',
      secondary_ability: 'charisma',
    });

    const patch = buildPathSelectionDraftPatch('path-a', selected);

    expect(patch).toEqual({
      archetypePathId: 'path-a',
      archetypeType: 'power',
      pow_abil: 'intelligence',
      mart_abil: null,
    });
    expect(patch).not.toHaveProperty('skills');
    expect(patch).not.toHaveProperty('abilities');
    expect(patch).not.toHaveProperty('abilitiesMode');
    expect(patch).not.toHaveProperty('archetypeFeatIds');
    expect(patch).not.toHaveProperty('characterFeatIds');
    expect(patch).not.toHaveProperty('loadoutWeapons');
    expect(patch).not.toHaveProperty('loadoutArmor');
    expect(patch).not.toHaveProperty('armaments');
    expect(patch).not.toHaveProperty('equipment');
    expect(patch).not.toHaveProperty('powerIds');
    expect(patch).not.toHaveProperty('techniqueIds');
    expect(patch).not.toHaveProperty('currency');
    expect(patch).not.toHaveProperty('unarmedProwess');
    expect(patch).not.toHaveProperty('declinedPathSkillIds');
    expect(patch).not.toHaveProperty('equipmentPhase');
  });

  it('different-path selection invalidates abilities/skills/feats/loadout/powers', () => {
    const selected = path({
      id: 'path-b',
      type: 'martial',
      mart_abil: 'strength',
      secondary_ability: 'vitality',
    });

    const patch = buildPathSelectionDraftPatch('path-a', selected);

    expect(patch.archetypePathId).toBe('path-b');
    expect(patch.archetypeType).toBe('martial');
    expect(patch.pow_abil).toBeNull();
    expect(patch.mart_abil).toBe('strength');

    expect(patch.abilities).toEqual({ ...DEFAULT_ABILITIES });
    expect(patch.abilitiesMode).toBeNull();
    expect(patch.skills).toEqual({});
    expect(patch.declinedPathSkillIds).toEqual([]);
    expect(patch.archetypeFeatIds).toEqual([]);
    expect(patch.characterFeatIds).toEqual([]);
    expect(patch.equipmentPhase).toBe('weapon');
    expect(patch.loadoutWeapons).toEqual([]);
    expect(patch.loadoutArmor).toEqual([]);
    expect(patch.armaments).toEqual([]);
    expect(patch.equipment).toEqual([]);
    expect(patch.currency).toBe(CHARACTER_STARTING_CURRENCY);
    expect(patch.unarmedProwess).toBe(0);
    expect(patch.powerIds).toEqual([]);
    expect(patch.techniqueIds).toEqual([]);
  });

  it('first path pick (null current) is treated as a path change', () => {
    const selected = path({
      id: 'path-first',
      type: 'powered-martial',
      pow_abil: 'acuity',
      mart_abil: 'agility',
    });

    const patch = buildPathSelectionDraftPatch(null, selected);

    expect(patch.archetypePathId).toBe('path-first');
    expect(patch.archetypeType).toBe('powered-martial');
    expect(patch.pow_abil).toBe('acuity');
    expect(patch.mart_abil).toBe('agility');
    expect(patch.skills).toEqual({});
    expect(patch.powerIds).toEqual([]);
    expect(patch.abilitiesMode).toBeNull();
  });
});
