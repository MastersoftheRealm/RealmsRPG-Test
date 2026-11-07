import { describe, expect, it, vi } from 'vitest';
import type { Character } from '@/types';
import type { CoreRulesMap } from '@/types/core-rules';
import { buildLibrarySectionData } from './build-library-section-data';
import { computeSheetPointPools } from '@/lib/character/sheet-edit-notification';
import type { SheetLibraryModel } from './library-section-props';
import type { CharacterSheetDerivedHandlers } from './use-character-sheet-derived';

const noop = () => {};

function handlers(): CharacterSheetDerivedHandlers {
  return {
    setCharacter: vi.fn(),
    handleRemovePower: noop,
    handleTogglePowerInnate: noop,
    handleUsePower: noop,
    handleRemoveTechnique: noop,
    handleUseTechnique: noop,
    handleRemoveWeapon: noop,
    handleToggleEquipWeapon: noop,
    handleRemoveShield: noop,
    handleToggleEquipShield: noop,
    handleRemoveArmor: noop,
    handleToggleEquipArmor: noop,
    handleRemoveEquipment: noop,
    handleEquipmentQuantityChange: noop,
    handleCurrencyChange: noop,
    handleStateUsesChange: noop,
    handleEnterState: noop,
    handleFeatUsesChange: noop,
    handleFeatLevelChange: noop,
    handleRequestRemoveFeat: noop,
    handleTraitUsesChange: noop,
    handleFeatCustomizationChange: noop,
    handleTraitCustomizationChange: noop,
  };
}

const libraryModel: SheetLibraryModel = {
  archetypeProgression: null,
  calculatedMaxEnergy: 10,
  characterSpeciesTraits: [],
  archetypeFeatsForDisplay: [],
  characterFeatsForDisplay: [],
  stateFeatsList: [],
  stateUsesCurrent: 0,
  stateUsesMax: 0,
};

const character: Character = {
  id: '1',
  name: 'Test',
  level: 1,
  abilities: {
    strength: 0,
    vitality: 0,
    agility: 0,
    acuity: 0,
    intelligence: 0,
    charisma: 0,
  },
  archetype: { id: 'a', type: 'powered-martial' },
};

describe('buildLibrarySectionData feat caps align with core_rules', () => {
  const rules = {
    PROGRESSION_PLAYER: { characterFeatsPerLevel: 2 },
  } as Partial<CoreRulesMap>;

  it('exposes two character feat slots at level 1 when DB says characterFeatsPerLevel 2', () => {
    const data = buildLibrarySectionData({
      character,
      enrichedData: null,
      libraryModel,
      handlers: handlers(),
      isOwner: true,
      rules,
    });
    expect(data.maxCharacterFeats).toBe(2);
    expect(data.maxArchetypeFeats).toBe(2);
  });

  it('matches computeSheetPointPools character feat budget for the same rules', () => {
    const data = buildLibrarySectionData({
      character,
      enrichedData: null,
      libraryModel,
      handlers: handlers(),
      isOwner: true,
      rules,
    });
    const pools = computeSheetPointPools({
      character,
      characterSpeciesSkills: [],
      featsDb: [],
      rules,
    });
    expect(pools.characterFeatRemaining).toBe(data.maxCharacterFeats);
  });
});
