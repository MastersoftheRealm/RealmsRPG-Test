/**
 * Read-only character sheet assemble (campaign RM view).
 * Uses isEditMode/isOwner false + no-op mutators — no parallel section fork (TASK-597).
 */

import type { Dispatch, SetStateAction } from 'react';
import type { EnrichedCharacterData } from '@/lib/data-enrichment';
import type { Character, CharacterLibraryTabId } from '@/types';
import type { CharacterSheetContextValue } from './character-sheet-context';
import type { SheetLibraryModel } from './library-section-props';
import type {
  CharacterSheetDerivedHandlers,
  CharacterSheetPointBudgets,
  CharacterSheetSkillRow,
  CharacterSheetStats,
} from './use-character-sheet-derived';

const noop = () => {};

export const readOnlySetCharacter: Dispatch<SetStateAction<Character | null>> = noop;

/** Library mutators that no-op — safe for view-only CharacterSheetBody. */
export function buildReadOnlyLibraryHandlers(
  setCharacter: Dispatch<SetStateAction<Character | null>> = readOnlySetCharacter,
): CharacterSheetDerivedHandlers {
  return {
    setCharacter,
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

/** Full sheet context for read-only consumers (campaign RM character view). */
export function buildReadOnlySheetContextValue(input: {
  character: Character;
  skills: CharacterSheetSkillRow[];
  pointBudgets: CharacterSheetPointBudgets | null;
  enrichedData: EnrichedCharacterData | null;
  libraryModel: SheetLibraryModel | null;
  libraryHandlers?: CharacterSheetDerivedHandlers;
  characterSpeciesSkills: string[];
  libraryActiveTab: CharacterLibraryTabId;
  setLibraryActiveTab: (tab: CharacterLibraryTabId) => void;
  displayCharacter?: Character | null;
  calculatedStats?: CharacterSheetStats | null;
}): CharacterSheetContextValue {
  return {
    character: input.character,
    setCharacter: readOnlySetCharacter,
    isEditMode: false,
    isOwner: false,
    skills: input.skills,
    pointBudgets: input.pointBudgets,
    enrichedData: input.enrichedData,
    libraryModel: input.libraryModel,
    libraryHandlers: input.libraryHandlers ?? buildReadOnlyLibraryHandlers(),
    characterSpeciesSkills: input.characterSpeciesSkills,
    libraryActiveTab: input.libraryActiveTab,
    setLibraryActiveTab: input.setLibraryActiveTab,
    displayCharacter: input.displayCharacter ?? input.character,
    calculatedStats: input.calculatedStats ?? null,
    addModalType: null,
    setAddModalType: noop,
    featModalType: null,
    setFeatModalType: noop,
    skillModalType: null,
    setSkillModalType: noop,
    featToRemove: null,
    setFeatToRemove: noop,
    showLevelUpModal: false,
    setShowLevelUpModal: noop,
    showRecoveryModal: false,
    setShowRecoveryModal: noop,
    showEditArchetypeModal: false,
    setShowEditArchetypeModal: noop,
    editArchetypeSessionKey: 0,
    showEditSpeciesModal: false,
    setShowEditSpeciesModal: noop,
    onModalAdd: noop,
    onAddFeats: noop,
    onAddSkills: noop,
    onConfirmRemoveFeat: noop,
    onLevelUp: noop,
    onFullRecovery: noop,
    onPartialRecovery: noop,
    onArchetypeSave: noop,
    onSpeciesSave: noop,
    onAbilityChange: noop,
    onDefenseChange: noop,
    onTempModifiersChange: noop,
    onSkillChange: noop,
    onRemoveSkill: noop,
    onAddSubSkill: noop,
    onMartialProfChange: noop,
    onPowerProfChange: noop,
    onMilestoneChoiceChange: noop,
    onEditArchetype: noop,
    onEditSpecies: noop,
  };
}
