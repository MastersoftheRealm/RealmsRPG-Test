/**
 * Resolve LibrarySection panel data from sheet context pieces (TASK-365 / TASK-667 cleanup).
 * Lives under components/ so character-sheet does not import from app/.
 */

import type { CharacterProficiency, Item, Character, CharacterAncestry } from '@/types';
import type { EnrichedCharacterData } from '@/lib/data-enrichment';
import { characterToFeatRequirementCharacter } from '@/lib/game/feat-requirements';
import { calculateMaxArchetypeFeats, calculateMaxCharacterFeats } from '@/lib/game/formulas';
import { getArchetypeAbilityScore, calculatePowerAttackBonus } from '@/lib/game/calculations';
import { withAbilitiesForResourceMaxima } from '@/lib/character/temp-modifiers';
import type { LibrarySectionData, SheetLibraryModel } from './library-section-props';
import type { CharacterSheetDerivedHandlers } from './use-character-sheet-derived';

export function buildLibrarySectionData(input: {
  character: Character;
  enrichedData: EnrichedCharacterData | null | undefined;
  libraryModel: SheetLibraryModel;
  handlers: CharacterSheetDerivedHandlers;
}): LibrarySectionData {
  const { character, enrichedData, libraryModel: m, handlers } = input;
  const {
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
  } = handlers;

  const archetypeProgression = m.archetypeProgression;

  return {
    powers: enrichedData?.powers || character.powers || [],
    techniques: enrichedData?.techniques || character.techniques || [],
    weapons: (enrichedData?.weapons || character.equipment?.weapons || []) as Item[],
    shields: (enrichedData?.shields || character.equipment?.shields || []) as Item[],
    armor: (enrichedData?.armor || character.equipment?.armor || []) as Item[],
    equipment: (enrichedData?.equipment || character.equipment?.items || []) as Item[],
    currency: character.currency,
    innateEnergy: archetypeProgression?.innateEnergy || 0,
    innateThreshold: archetypeProgression?.innateThreshold || 0,
    innatePools: archetypeProgression?.innatePools || 0,
    currentEnergy: character.currentEnergy ?? character.energy?.current ?? m.calculatedMaxEnergy,
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
    onArchetypeDescChange: (v) =>
      setCharacter((prev) => (prev ? { ...prev, archetypeDesc: v } : null)),
    onNotesChange: (v) => setCharacter((prev) => (prev ? { ...prev, notes: v } : null)),
    namedNotes: character.namedNotes,
    onAddNote: () => {
      const newNote = { id: `note_${Date.now()}`, name: 'New Note', content: '' };
      setCharacter((prev) =>
        prev ? { ...prev, namedNotes: [...(prev.namedNotes || []), newNote] } : null,
      );
    },
    onUpdateNote: (id, updates) => {
      setCharacter((prev) =>
        prev
          ? {
              ...prev,
              namedNotes: (prev.namedNotes || []).map((note) =>
                note.id === id ? { ...note, ...updates } : note,
              ),
            }
          : null,
      );
    },
    onDeleteNote: (id) => {
      setCharacter((prev) =>
        prev
          ? { ...prev, namedNotes: (prev.namedNotes || []).filter((note) => note.id !== id) }
          : null,
      );
    },
    level: character.level,
    // TP limit respects ability temps only when applyAbilityToResourceMaxima is on (ADR-0006)
    archetypeAbility: getArchetypeAbilityScore(withAbilitiesForResourceMaxima(character)),
    powerPartsDb: m.powerPartsDb,
    techniquePartsDb: m.techniquePartsDb,
    itemPropertiesDb: m.itemPropertiesDb,
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
    speciesTraitsFromCodex: m.characterSpeciesTraits,
    archetypeFeats: m.archetypeFeatsForDisplay,
    characterFeats: m.characterFeatsForDisplay,
    stateFeats: m.stateFeatsList,
    stateUsesCurrent: m.stateUsesCurrent,
    stateUsesMax: m.stateUsesMax,
    onStateUsesChange: handleStateUsesChange,
    onEnterState: handleEnterState,
    maxArchetypeFeats: calculateMaxArchetypeFeats(
      character.level || 1,
      (character.archetype?.type || 'power') as 'power' | 'martial' | 'powered-martial',
      undefined,
      character.archetypeChoices,
    ),
    maxCharacterFeats: calculateMaxCharacterFeats(character.level || 1),
    onFeatUsesChange: handleFeatUsesChange,
    onFeatLevelChange: handleFeatLevelChange,
    featRequirementCharacter: characterToFeatRequirementCharacter(character),
    onRemoveFeat: handleRequestRemoveFeat,
    traitsDb: m.traitsDb,
    featsDb: m.featsDb,
    traitUses: character.traitUses,
    onTraitUsesChange: handleTraitUsesChange,
    traitCustomizations: character.traitCustomizations,
    onFeatCustomizationChange: handleFeatCustomizationChange,
    onTraitCustomizationChange: handleTraitCustomizationChange,
  };
}
