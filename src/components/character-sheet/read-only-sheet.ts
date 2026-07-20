/**
 * Read-only character sheet assemble (campaign RM view).
 * Uses isEditMode/isOwner false + no-op mutators — no parallel section fork (TASK-597).
 */

import type { Dispatch, SetStateAction } from 'react';
import type { EnrichedCharacterData } from '@/lib/data-enrichment';
import type { Character, CharacterLibraryTabId } from '@/types';
import type { CharacterSheetContextValue } from './character-sheet-context';
import type { LibrarySectionProps } from './library-section';
import type {
  CharacterSheetDerivedHandlers,
  CharacterSheetPointBudgets,
  CharacterSheetSkillRow,
} from './use-character-sheet-derived';

const noop = () => {};

export const readOnlySetCharacter: Dispatch<SetStateAction<Character | null>> = noop;

/** Library mutators that no-op — safe for view-only CharacterSheetBody. */
export function buildReadOnlyLibraryHandlers(
  setCharacter: Dispatch<SetStateAction<Character | null>> = readOnlySetCharacter
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

type LibraryProps = Omit<LibrarySectionProps, 'className' | 'activeTab' | 'onActiveTabChange'> | null;

/** Full sheet context for read-only consumers (campaign RM character view). */
export function buildReadOnlySheetContextValue(input: {
  character: Character;
  skills: CharacterSheetSkillRow[];
  pointBudgets: CharacterSheetPointBudgets | null;
  enrichedData: EnrichedCharacterData | null;
  librarySectionProps: LibraryProps;
  characterSpeciesSkills: string[];
  libraryActiveTab: CharacterLibraryTabId;
  setLibraryActiveTab: (tab: CharacterLibraryTabId) => void;
}): CharacterSheetContextValue {
  return {
    character: input.character,
    setCharacter: readOnlySetCharacter,
    isEditMode: false,
    isOwner: false,
    setAddModalType: noop,
    setFeatModalType: noop,
    setSkillModalType: noop,
    skills: input.skills,
    pointBudgets: input.pointBudgets,
    enrichedData: input.enrichedData,
    librarySectionProps: input.librarySectionProps,
    characterSpeciesSkills: input.characterSpeciesSkills,
    libraryActiveTab: input.libraryActiveTab,
    setLibraryActiveTab: input.setLibraryActiveTab,
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
