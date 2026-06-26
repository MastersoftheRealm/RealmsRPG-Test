/**
 * Shared LibrarySection props for desktop + mobile character sheet (TASK-365).
 */

import type { LibrarySectionProps } from '@/components/character-sheet/library-section';
import type { CharacterProficiency, Item, Character, CharacterAncestry } from '@/types';
import { characterToFeatRequirementCharacter } from '@/lib/game/feat-requirements';
import {
  calculateMaxArchetypeFeats,
  calculateMaxCharacterFeats,
} from '@/lib/game/formulas';
import { getArchetypeAbilityScore, calculatePowerAttackBonus } from '@/lib/game/calculations';

type EnrichedSheetData = {
  powers?: Character['powers'];
  techniques?: Character['techniques'];
  weapons?: unknown[];
  shields?: unknown[];
  armor?: unknown[];
  equipment?: unknown[];
};

type ArchetypeProgression = {
  innateEnergy?: number;
  innateThreshold?: number;
  innatePools?: number;
};

export type BuildLibrarySectionPropsArgs = {
  character: Character;
  enrichedData: EnrichedSheetData | null | undefined;
  archetypeProgression: ArchetypeProgression | null | undefined;
  calculatedMaxEnergy: number;
  powerPartsDb: LibrarySectionProps['powerPartsDb'];
  techniquePartsDb: LibrarySectionProps['techniquePartsDb'];
  itemPropertiesDb: LibrarySectionProps['itemPropertiesDb'];
  traitsDb: LibrarySectionProps['traitsDb'];
  featsDb: LibrarySectionProps['featsDb'];
  characterSpeciesTraits: string[];
  archetypeFeatsForDisplay: LibrarySectionProps['archetypeFeats'];
  characterFeatsForDisplay: LibrarySectionProps['characterFeats'];
  stateFeatsList: LibrarySectionProps['stateFeats'];
  stateUsesCurrent: number;
  stateUsesMax: number;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  handleRemovePower: NonNullable<LibrarySectionProps['onRemovePower']>;
  handleTogglePowerInnate: NonNullable<LibrarySectionProps['onTogglePowerInnate']>;
  handleUsePower: NonNullable<LibrarySectionProps['onUsePower']>;
  handleRemoveTechnique: NonNullable<LibrarySectionProps['onRemoveTechnique']>;
  handleUseTechnique: NonNullable<LibrarySectionProps['onUseTechnique']>;
  handleRemoveWeapon: NonNullable<LibrarySectionProps['onRemoveWeapon']>;
  handleToggleEquipWeapon: NonNullable<LibrarySectionProps['onToggleEquipWeapon']>;
  handleRemoveShield: NonNullable<LibrarySectionProps['onRemoveShield']>;
  handleToggleEquipShield: NonNullable<LibrarySectionProps['onToggleEquipShield']>;
  handleRemoveArmor: NonNullable<LibrarySectionProps['onRemoveArmor']>;
  handleToggleEquipArmor: NonNullable<LibrarySectionProps['onToggleEquipArmor']>;
  handleRemoveEquipment: NonNullable<LibrarySectionProps['onRemoveEquipment']>;
  handleEquipmentQuantityChange: NonNullable<LibrarySectionProps['onEquipmentQuantityChange']>;
  handleCurrencyChange: NonNullable<LibrarySectionProps['onCurrencyChange']>;
  handleStateUsesChange: NonNullable<LibrarySectionProps['onStateUsesChange']>;
  handleEnterState: NonNullable<LibrarySectionProps['onEnterState']>;
  handleFeatUsesChange: NonNullable<LibrarySectionProps['onFeatUsesChange']>;
  handleFeatLevelChange: NonNullable<LibrarySectionProps['onFeatLevelChange']>;
  handleRequestRemoveFeat: NonNullable<LibrarySectionProps['onRemoveFeat']>;
  handleTraitUsesChange: NonNullable<LibrarySectionProps['onTraitUsesChange']>;
  handleFeatCustomizationChange: NonNullable<LibrarySectionProps['onFeatCustomizationChange']>;
  handleTraitCustomizationChange: NonNullable<LibrarySectionProps['onTraitCustomizationChange']>;
};

export function buildLibrarySectionProps({
  character,
  enrichedData,
  archetypeProgression,
  calculatedMaxEnergy,
  powerPartsDb,
  techniquePartsDb,
  itemPropertiesDb,
  traitsDb,
  featsDb,
  characterSpeciesTraits,
  archetypeFeatsForDisplay,
  characterFeatsForDisplay,
  stateFeatsList,
  stateUsesCurrent,
  stateUsesMax,
  setCharacter,
  handleRemovePower,
  handleTogglePowerInnate,
  handleUsePower,
  handleRemoveTechnique,
  handleUseTechnique,
  handleRemoveWeapon,
  handleToggleEquipWeapon,
  handleRemoveShield,
  handleToggleEquipShield,
  handleRemoveArmor,
  handleToggleEquipArmor,
  handleRemoveEquipment,
  handleEquipmentQuantityChange,
  handleCurrencyChange,
  handleStateUsesChange,
  handleEnterState,
  handleFeatUsesChange,
  handleFeatLevelChange,
  handleRequestRemoveFeat,
  handleTraitUsesChange,
  handleFeatCustomizationChange,
  handleTraitCustomizationChange,
}: BuildLibrarySectionPropsArgs): Omit<LibrarySectionProps, 'className' | 'activeTab' | 'onActiveTabChange'> {
  return {
    powers: enrichedData?.powers || character.powers || [],
    techniques: enrichedData?.techniques || character.techniques || [],
    weapons: (enrichedData?.weapons || (character.equipment?.weapons || [])) as Item[],
    shields: (enrichedData?.shields || (character.equipment?.shields || [])) as Item[],
    armor: (enrichedData?.armor || (character.equipment?.armor || [])) as Item[],
    equipment: (enrichedData?.equipment || (character.equipment?.items || [])) as Item[],
    currency: character.currency,
    innateEnergy: archetypeProgression?.innateEnergy || 0,
    innateThreshold: archetypeProgression?.innateThreshold || 0,
    innatePools: archetypeProgression?.innatePools || 0,
    currentEnergy: character.currentEnergy ?? character.energy?.current ?? calculatedMaxEnergy,
    martialProficiency: character.mart_prof,
    powerAttackBonus: calculatePowerAttackBonus(character),
    onRemovePower: handleRemovePower,
    onTogglePowerInnate: handleTogglePowerInnate,
    onUsePower: handleUsePower,
    onRemoveTechnique: handleRemoveTechnique,
    onUseTechnique: handleUseTechnique,
    onRemoveWeapon: handleRemoveWeapon,
    onToggleEquipWeapon: handleToggleEquipWeapon,
    onRemoveShield: handleRemoveShield,
    onToggleEquipShield: handleToggleEquipShield,
    onRemoveArmor: handleRemoveArmor,
    onToggleEquipArmor: handleToggleEquipArmor,
    onRemoveEquipment: handleRemoveEquipment,
    onEquipmentQuantityChange: handleEquipmentQuantityChange,
    onCurrencyChange: handleCurrencyChange,
    weight: character.weight,
    height: character.height,
    appearance: character.appearance,
    archetypeDesc: character.archetypeDesc,
    notes: character.notes,
    abilities: character.abilities,
    onWeightChange: (v) => setCharacter((prev) => (prev ? { ...prev, weight: v } : null)),
    onHeightChange: (v) => setCharacter((prev) => (prev ? { ...prev, height: v } : null)),
    visibility: character.visibility,
    onVisibilityChange: (v) => setCharacter((prev) => (prev ? { ...prev, visibility: v } : null)),
    speedDisplayUnit: character.speedDisplayUnit ?? 'spaces',
    onAppearanceChange: (v) => setCharacter((prev) => (prev ? { ...prev, appearance: v } : null)),
    onArchetypeDescChange: (v) => setCharacter((prev) => (prev ? { ...prev, archetypeDesc: v } : null)),
    onNotesChange: (v) => setCharacter((prev) => (prev ? { ...prev, notes: v } : null)),
    namedNotes: character.namedNotes,
    onAddNote: () => {
      const newNote = { id: `note_${Date.now()}`, name: 'New Note', content: '' };
      setCharacter((prev) =>
        prev ? { ...prev, namedNotes: [...(prev.namedNotes || []), newNote] } : null
      );
    },
    onUpdateNote: (id, updates) => {
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              namedNotes: (prev.namedNotes || []).map((note) =>
                note.id === id ? { ...note, ...updates } : note
              ),
            }
          : null
      );
    },
    onDeleteNote: (id) => {
      setCharacter((prev) =>
        prev
          ? { ...prev, namedNotes: (prev.namedNotes || []).filter((note) => note.id !== id) }
          : null
      );
    },
    level: character.level,
    archetypeAbility: getArchetypeAbilityScore(character),
    powerPartsDb,
    techniquePartsDb,
    itemPropertiesDb,
    proficiencies: character.proficiencies,
    onProficienciesChange: (next: CharacterProficiency[]) =>
      setCharacter((prev) => (prev ? { ...prev, proficiencies: next } : null)),
    unarmedProwess: character.unarmedProwess ?? 0,
    onUnarmedProwessChange: (level) =>
      setCharacter((prev) => (prev ? { ...prev, unarmedProwess: level } : null)),
    tabVisibility: character.libraryTabVisibility,
    onTabVisibilityChange: (next) =>
      setCharacter((prev) => (prev ? { ...prev, libraryTabVisibility: next } : null)),
    ancestry: character.ancestry as CharacterAncestry,
    vanillaTraits: {
      ancestryTraits: character.ancestryTraits,
      flawTrait: character.flawTrait,
      characteristicTrait: character.characteristicTrait,
      speciesTraits: character.speciesTraits,
    },
    speciesTraitsFromCodex: characterSpeciesTraits,
    archetypeFeats: archetypeFeatsForDisplay,
    characterFeats: characterFeatsForDisplay,
    stateFeats: stateFeatsList,
    stateUsesCurrent,
    stateUsesMax,
    onStateUsesChange: handleStateUsesChange,
    onEnterState: handleEnterState,
    maxArchetypeFeats: calculateMaxArchetypeFeats(
      character.level || 1,
      (character.archetype?.type || 'power') as 'power' | 'martial' | 'powered-martial'
    ),
    maxCharacterFeats: calculateMaxCharacterFeats(character.level || 1),
    onFeatUsesChange: handleFeatUsesChange,
    onFeatLevelChange: handleFeatLevelChange,
    featRequirementCharacter: characterToFeatRequirementCharacter(character),
    onRemoveFeat: handleRequestRemoveFeat,
    traitsDb,
    featsDb,
    traitUses: character.traitUses,
    onTraitUsesChange: handleTraitUsesChange,
    traitCustomizations: character.traitCustomizations,
    onFeatCustomizationChange: handleFeatCustomizationChange,
    onTraitCustomizationChange: handleTraitCustomizationChange,
  };
}
