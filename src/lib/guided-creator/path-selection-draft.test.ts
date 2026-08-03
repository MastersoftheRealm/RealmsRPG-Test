import { describe, expect, it } from 'vitest';
import {
  buildCustomArchetypeDraftPatch,
  buildEnterCustomArchetypeLayerPatch,
  buildEnterPathLayerPatch,
  buildOpenCustomPathEntryPatch,
  buildOpenGuidedPathEntryPatch,
  buildPathSelectionDraftPatch,
  isGuidedCustomArchetypeComplete,
} from './path-selection-draft';
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
      pathLayer: 'l1',
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

describe('Path L1↔L3 layer patches', () => {
  it('enter custom archetype clears path and dependents', () => {
    const patch = buildEnterCustomArchetypeLayerPatch();
    expect(patch.creatorEntryMode).toBe('custom');
    expect(patch.pathLayer).toBe('l3');
    expect(patch.archetypePathId).toBeNull();
    expect(patch.archetypeType).toBeNull();
    expect(patch.skills).toEqual({});
    expect(patch.innatePowerIds).toEqual([]);
  });

  it('enter path layer clears forge picks', () => {
    const patch = buildEnterPathLayerPatch();
    expect(patch.pathLayer).toBe('l1');
    expect(patch.archetypePathId).toBeNull();
    expect(patch.mart_abil).toBeNull();
  });

  it('custom chooser entry sets deep catalog mode and Path L3', () => {
    const patch = buildOpenCustomPathEntryPatch();
    expect(patch.creatorEntryMode).toBe('custom');
    expect(patch.pathLayer).toBe('l3');
    expect(patch.archetypePathId).toBeNull();
    expect(patch.abilities).toEqual({ ...DEFAULT_ABILITIES });
    expect(patch.abilitiesMode).toBeNull();
    expect(patch.archetypeType).toBeNull();
  });

  it('guided chooser entry sets guided mode and Path L1', () => {
    const patch = buildOpenGuidedPathEntryPatch();
    expect(patch.creatorEntryMode).toBe('guided');
    expect(patch.pathLayer).toBe('l1');
  });

  it('custom archetype complete rules match forge Continue', () => {
    expect(isGuidedCustomArchetypeComplete('power', 'intelligence', null)).toBe(true);
    expect(isGuidedCustomArchetypeComplete('martial', null, 'strength')).toBe(true);
    expect(isGuidedCustomArchetypeComplete('powered-martial', 'intelligence', 'strength')).toBe(
      true
    );
    expect(isGuidedCustomArchetypeComplete('powered-martial', 'strength', 'strength')).toBe(false);
    expect(isGuidedCustomArchetypeComplete('power', null, null)).toBe(false);
  });

  it('type change clears dependents; ability-only update does not', () => {
    const typeChange = buildCustomArchetypeDraftPatch({
      type: 'martial',
      powAbil: null,
      martAbil: 'strength',
      previousType: 'power',
    });
    expect(typeChange.skills).toEqual({});
    expect(typeChange.pow_abil).toBeNull();
    expect(typeChange.mart_abil).toBe('strength');

    const abilityOnly = buildCustomArchetypeDraftPatch({
      type: 'martial',
      powAbil: null,
      martAbil: 'agility',
      previousType: 'martial',
    });
    expect(abilityOnly).not.toHaveProperty('skills');
    expect(abilityOnly.mart_abil).toBe('agility');
  });
});
