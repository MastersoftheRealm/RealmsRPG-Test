'use client';

/**
 * Character sheet actions facade (TASK-381 Phase 2)
 * =================================================
 * Composes domain hooks. Public return shape must stay stable for
 * characters/[id]/page.tsx.
 *
 * Domains:
 * - use-sheet-auto-proficiencies
 * - use-sheet-library-actions
 * - use-sheet-resource-actions
 * - use-sheet-feat-actions
 * - use-sheet-skill-identity-actions
 */

import { useMemo } from 'react';
import type { Archetype, Character, CharacterFeat } from '@/types';
import type { CodexFeat, Skill, Trait } from '@/hooks/codex-types';
import type { CharacterSheetStats, CharacterSheetDerivedHandlers } from './use-character-sheet-derived';
import type { AddModalType, FeatModalType, SkillModalType } from './character-sheet-context';
import type { LibrarySectionData } from './library-section-props';
import { useSheetAutoProficiencies } from './use-sheet-auto-proficiencies';
import { useSheetLibraryActions } from './use-sheet-library-actions';
import { useSheetResourceActions } from './use-sheet-resource-actions';
import { useSheetFeatActions } from './use-sheet-feat-actions';
import { useSheetSkillIdentityActions } from './use-sheet-skill-identity-actions';

export interface UseCharacterSheetActionsArgs {
  character: Character | null;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  calculatedStats: CharacterSheetStats | null;
  featsDb: CodexFeat[];
  codexSkills: Skill[];
  traitsDb: Trait[];
  codexArchetypes: Archetype[];
  powerPartsDb: LibrarySectionData['powerPartsDb'];
  techniquePartsDb: LibrarySectionData['techniquePartsDb'];
  itemPropertiesDb: LibrarySectionData['itemPropertiesDb'];
  showToast: (message: string, variant?: 'success' | 'error' | 'warning' | 'info') => void;
  user: { uid: string } | null;
  addModalType: AddModalType;
  setFeatModalType: (type: FeatModalType) => void;
  setSkillModalType: (type: SkillModalType) => void;
  setFeatToRemove: (value: { id: string; name: string } | null) => void;
  featToRemove: { id: string; name: string } | null;
  setError: (message: string | null) => void;
  setUploadingPortrait: (value: boolean) => void;
  setPortraitRefreshKey: (value: number) => void;
  setShowEditArchetypeModal: (value: boolean) => void;
  setShowEditSpeciesModal: (value: boolean) => void;
  stateFeatsList: Array<CharacterFeat & { type: 'archetype' | 'character' }>;
  stateUsesMax: number;
}

export function useCharacterSheetActions(args: UseCharacterSheetActionsArgs) {
  const {
    character,
    setCharacter,
    calculatedStats,
    featsDb,
    codexSkills,
    traitsDb,
    codexArchetypes,
    powerPartsDb,
    techniquePartsDb,
    itemPropertiesDb,
    showToast,
    user,
    addModalType,
    setFeatModalType,
    setSkillModalType,
    setFeatToRemove,
    featToRemove,
    setError,
    setUploadingPortrait,
    setPortraitRefreshKey,
    setShowEditArchetypeModal,
    setShowEditSpeciesModal,
    stateFeatsList,
    stateUsesMax,
  } = args;

  const resource = useSheetResourceActions({
    character,
    setCharacter,
    calculatedStats,
    featsDb,
    traitsDb,
    codexArchetypes,
    showToast,
    user,
    setError,
    setUploadingPortrait,
    setPortraitRefreshKey,
  });

  const { applyAutoProficiencies } = useSheetAutoProficiencies({
    character,
    setCharacter,
    powerPartsDb,
    techniquePartsDb,
    itemPropertiesDb,
    showToast,
  });

  const library = useSheetLibraryActions({
    character,
    setCharacter,
    calculatedStats,
    addModalType,
    applyAutoProficiencies,
    showToast,
  });

  const feats = useSheetFeatActions({
    character,
    setCharacter,
    featsDb,
    codexSkills,
    traitsDb,
    setFeatModalType,
    setFeatToRemove,
    featToRemove,
    stateFeatsList,
    stateUsesMax,
  });

  const skillsIdentity = useSheetSkillIdentityActions({
    character,
    setCharacter,
    setSkillModalType,
    setShowEditArchetypeModal,
    setShowEditSpeciesModal,
  });

  const libraryHandlers: CharacterSheetDerivedHandlers = useMemo(
    () => ({
      setCharacter,
      handleRemovePower: library.handleRemovePower,
      handleTogglePowerInnate: library.handleTogglePowerInnate,
      handleUsePower: library.handleUsePower,
      handleRemoveTechnique: library.handleRemoveTechnique,
      handleUseTechnique: library.handleUseTechnique,
      handleRemoveWeapon: library.handleRemoveWeapon,
      handleToggleEquipWeapon: library.handleToggleEquipWeapon,
      handleRemoveShield: library.handleRemoveShield,
      handleToggleEquipShield: library.handleToggleEquipShield,
      handleRemoveArmor: library.handleRemoveArmor,
      handleToggleEquipArmor: library.handleToggleEquipArmor,
      handleRemoveEquipment: library.handleRemoveEquipment,
      handleEquipmentQuantityChange: library.handleEquipmentQuantityChange,
      handleCurrencyChange: library.handleCurrencyChange,
      handleStateUsesChange: feats.handleStateUsesChange,
      handleEnterState: feats.handleEnterState,
      handleFeatUsesChange: feats.handleFeatUsesChange,
      handleFeatLevelChange: feats.handleFeatLevelChange,
      handleRequestRemoveFeat: feats.handleRequestRemoveFeat,
      handleTraitUsesChange: feats.handleTraitUsesChange,
      handleFeatCustomizationChange: feats.handleFeatCustomizationChange,
      handleTraitCustomizationChange: feats.handleTraitCustomizationChange,
    }),
    [
      setCharacter,
      library.handleRemovePower,
      library.handleTogglePowerInnate,
      library.handleUsePower,
      library.handleRemoveTechnique,
      library.handleUseTechnique,
      library.handleRemoveWeapon,
      library.handleToggleEquipWeapon,
      library.handleRemoveShield,
      library.handleToggleEquipShield,
      library.handleRemoveArmor,
      library.handleToggleEquipArmor,
      library.handleRemoveEquipment,
      library.handleEquipmentQuantityChange,
      library.handleCurrencyChange,
      feats.handleStateUsesChange,
      feats.handleEnterState,
      feats.handleFeatUsesChange,
      feats.handleFeatLevelChange,
      feats.handleRequestRemoveFeat,
      feats.handleTraitUsesChange,
      feats.handleFeatCustomizationChange,
      feats.handleTraitCustomizationChange,
    ],
  );

  // Public surface matches characters/[id]/page.tsx destructure (plus libraryHandlers bag).
  return {
    ...resource,
    handleModalAdd: library.handleModalAdd,
    handleAddFeats: feats.handleAddFeats,
    handleConfirmRemoveFeat: feats.handleConfirmRemoveFeat,
    ...skillsIdentity,
    libraryHandlers,
  };
}
