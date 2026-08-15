/**
 * Character sheet page orchestration facade (TASK-666d)
 * =====================================================
 * Composes data + UI chrome + sheet actions/context — keeps `page.tsx` thin.
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useCharacterSheetActions, resolveLibraryActiveTab } from '@/components/character-sheet';
import type { SheetLibraryModel } from '@/components/character-sheet/library-section-props';
import { buildLevelUpGuideContent } from '@/lib/level-up-guide';
import { useCharacterSheetPageData } from './use-character-sheet-page-data';
import { useCharacterSheetPageUi } from './use-character-sheet-page-ui';

export function useCharacterSheetPage(id: string) {
  const data = useCharacterSheetPageData(id);
  const ui = useCharacterSheetPageUi({
    id: data.id,
    character: data.character,
    setCharacter: data.setCharacter,
    showToast: data.showToast,
    hasUnsavedChanges: data.hasUnsavedChanges,
    saveNow: data.saveNow,
  });

  const effectiveEditMode = ui.isEditMode && data.isOwner;

  if (data.character) {
    const resolvedLibraryTab = resolveLibraryActiveTab(ui.libraryActiveTab, {
      isEditMode: effectiveEditMode,
      tabVisibility: data.character.libraryTabVisibility,
    });
    if (resolvedLibraryTab !== ui.libraryActiveTab) {
      ui.setLibraryActiveTab(resolvedLibraryTab);
    }
  }

  const {
    handleHealthChange,
    handleEnergyChange,
    handleActionPointsChange,
    handleExperienceChange,
    handleNameChange,
    handlePortraitChange,
    handlePortraitUrlChange,
    handleAbilityChange,
    handleDefenseChange,
    handleTempModifiersChange,
    handleHealthPointsChange,
    handleEnergyPointsChange,
    handleFullRecovery,
    handlePartialRecovery,
    handleLevelUp: applyLevelUp,
    handleAddFeats,
    handleConfirmRemoveFeat,
    handleAddSkills,
    handleRemoveSkill,
    handleSkillChange,
    handleMartialProfChange,
    handlePowerProfChange,
    handleArchetypeSave,
    handleEditSpeciesSave,
    handleMilestoneChoiceChange,
    handleModalAdd,
    libraryHandlers,
  } = useCharacterSheetActions({
    character: data.character,
    setCharacter: data.setCharacter,
    calculatedStats: data.calculatedStats,
    featsDb: data.featsDb,
    codexSkills: data.codexSkills,
    traitsDb: data.traitsDb,
    codexArchetypes: data.codexArchetypes,
    powerPartsDb: data.powerPartsDb,
    techniquePartsDb: data.techniquePartsDb,
    itemPropertiesDb: data.itemPropertiesDb,
    rules: data.rules,
    showToast: data.showToast,
    user: data.user,
    addModalType: ui.addModalType,
    setFeatModalType: ui.setFeatModalType,
    setSkillModalType: ui.setSkillModalType,
    setFeatToRemove: ui.setFeatToRemove,
    featToRemove: ui.featToRemove,
    setError: data.setError,
    setUploadingPortrait: ui.setUploadingPortrait,
    setPortraitRefreshKey: ui.setPortraitRefreshKey,
    setShowEditArchetypeModal: ui.setShowEditArchetypeModal,
    setShowEditSpeciesModal: ui.setShowEditSpeciesModal,
    stateFeatsList: data.stateFeatsList,
    stateUsesMax: data.stateUsesMax,
  });

  const handleLevelUp = useCallback(
    (newLevel: number) => {
      if (!data.character) return;
      const previousLevel = data.character.level || 1;
      applyLevelUp(newLevel);
      const guide = buildLevelUpGuideContent(data.character, previousLevel, newLevel, data.rules);
      if (guide) {
        if (guide.enterEditMode) ui.setIsEditMode(true);
        ui.setLevelUpGuide(guide);
      }
    },
    [data.character, applyLevelUp, data.rules, ui],
  );

  const libraryModel = useMemo((): SheetLibraryModel | null => {
    if (!data.character || !data.calculatedStats) return null;
    return {
      archetypeProgression: data.archetypeProgression,
      calculatedMaxEnergy: data.calculatedStats.maxEnergy,
      powerPartsDb: data.powerPartsDb,
      techniquePartsDb: data.techniquePartsDb,
      itemPropertiesDb: data.itemPropertiesDb,
      traitsDb: data.traitsDb,
      featsDb: data.featsDb,
      characterSpeciesTraits: data.characterSpeciesTraits,
      archetypeFeatsForDisplay: data.archetypeFeatsForDisplay,
      characterFeatsForDisplay: data.characterFeatsForDisplay,
      stateFeatsList: data.stateFeatsList,
      stateUsesCurrent: data.stateUsesCurrent,
      stateUsesMax: data.stateUsesMax,
    };
  }, [
    data.character,
    data.calculatedStats,
    data.archetypeProgression,
    data.powerPartsDb,
    data.techniquePartsDb,
    data.itemPropertiesDb,
    data.traitsDb,
    data.featsDb,
    data.characterSpeciesTraits,
    data.archetypeFeatsForDisplay,
    data.characterFeatsForDisplay,
    data.stateFeatsList,
    data.stateUsesCurrent,
    data.stateUsesMax,
  ]);

  const sheetContextValue = useMemo(
    () =>
      data.character
        ? {
            character: data.character,
            setCharacter: data.setCharacter,
            isEditMode: effectiveEditMode,
            isOwner: data.isOwner,
            skills: data.skills,
            pointBudgets: data.pointBudgets,
            enrichedData: data.enrichedData,
            libraryModel,
            libraryHandlers,
            characterSpeciesSkills: data.characterSpeciesSkills,
            libraryActiveTab: ui.libraryActiveTab,
            setLibraryActiveTab: ui.setLibraryActiveTab,
            displayCharacter: data.characterForDisplay,
            calculatedStats: data.calculatedStats,
            addModalType: ui.addModalType,
            setAddModalType: ui.setAddModalType,
            featModalType: ui.featModalType,
            setFeatModalType: ui.setFeatModalType,
            skillModalType: ui.skillModalType,
            setSkillModalType: ui.setSkillModalType,
            featToRemove: ui.featToRemove,
            setFeatToRemove: ui.setFeatToRemove,
            showLevelUpModal: ui.showLevelUpModal,
            setShowLevelUpModal: ui.setShowLevelUpModal,
            showRecoveryModal: ui.showRecoveryModal,
            setShowRecoveryModal: ui.setShowRecoveryModal,
            showEditArchetypeModal: ui.showEditArchetypeModal,
            setShowEditArchetypeModal: ui.setShowEditArchetypeModal,
            editArchetypeSessionKey: ui.editArchetypeSessionKey,
            showEditSpeciesModal: ui.showEditSpeciesModal,
            setShowEditSpeciesModal: ui.setShowEditSpeciesModal,
            onModalAdd: handleModalAdd,
            onAddFeats: handleAddFeats,
            onAddSkills: handleAddSkills,
            onConfirmRemoveFeat: handleConfirmRemoveFeat,
            onLevelUp: handleLevelUp,
            onFullRecovery: handleFullRecovery,
            onPartialRecovery: handlePartialRecovery,
            onArchetypeSave: handleArchetypeSave,
            onSpeciesSave: handleEditSpeciesSave,
            onAbilityChange: handleAbilityChange,
            onDefenseChange: handleDefenseChange,
            onTempModifiersChange: handleTempModifiersChange,
            onSkillChange: handleSkillChange,
            onRemoveSkill: handleRemoveSkill,
            onAddSubSkill: () => ui.setSkillModalType('subskill'),
            onMartialProfChange: handleMartialProfChange,
            onPowerProfChange: handlePowerProfChange,
            onMilestoneChoiceChange: handleMilestoneChoiceChange,
            onEditArchetype: () => {
              if (effectiveEditMode) ui.setShowEditArchetypeModal(true);
            },
            onEditSpecies: () => {
              if (effectiveEditMode) ui.setShowEditSpeciesModal(true);
            },
          }
        : null,
    [
      data.character,
      data.setCharacter,
      effectiveEditMode,
      data.isOwner,
      data.skills,
      data.pointBudgets,
      data.enrichedData,
      libraryModel,
      libraryHandlers,
      data.characterSpeciesSkills,
      data.characterForDisplay,
      data.calculatedStats,
      ui,
      handleModalAdd,
      handleAddFeats,
      handleAddSkills,
      handleConfirmRemoveFeat,
      handleLevelUp,
      handleFullRecovery,
      handlePartialRecovery,
      handleArchetypeSave,
      handleEditSpeciesSave,
      handleAbilityChange,
      handleDefenseChange,
      handleTempModifiersChange,
      handleSkillChange,
      handleRemoveSkill,
      handleMartialProfChange,
      handlePowerProfChange,
      handleMilestoneChoiceChange,
    ],
  );

  return {
    id: data.id,
    authLoading: data.authLoading,
    loading: data.loading,
    error: data.error,
    character: data.character,
    setCharacter: data.setCharacter,
    isEditMode: ui.isEditMode,
    effectiveEditMode,
    isOwner: data.isOwner,
    isInCampaign: data.isInCampaign,
    campaignContext: data.campaignContext,
    hasUnappliedPoints: data.hasUnappliedPoints,
    calculatedStats: data.calculatedStats,
    characterForDisplay: data.characterForDisplay,
    archetypeProgression: data.archetypeProgression,
    sheetContextValue,
    uploadingPortrait: ui.uploadingPortrait,
    portraitRefreshKey: ui.portraitRefreshKey,
    showSettingsModal: ui.showSettingsModal,
    setShowSettingsModal: ui.setShowSettingsModal,
    setShowLevelUpModal: ui.setShowLevelUpModal,
    setShowRecoveryModal: ui.setShowRecoveryModal,
    showSheetTourOffer: ui.showSheetTourOffer,
    setSheetTourOfferLatched: ui.setSheetTourOfferLatched,
    sheetTourActive: ui.sheetTourActive,
    setSheetTourActive: ui.setSheetTourActive,
    sheetTourRestartKey: ui.sheetTourRestartKey,
    handleRetakeSheetTour: ui.handleRetakeSheetTour,
    levelUpGuide: ui.levelUpGuide,
    setLevelUpGuide: ui.setLevelUpGuide,
    handleToggleEditMode: ui.handleToggleEditMode,
    handleHealthChange,
    handleEnergyChange,
    handleActionPointsChange,
    handleExperienceChange,
    handleNameChange,
    handlePortraitChange,
    handlePortraitUrlChange,
    handleHealthPointsChange,
    handleEnergyPointsChange,
    handleSettingsConfirmVisibility: ui.handleSettingsConfirmVisibility,
    handleSettingsConfirm: ui.handleSettingsConfirm,
  };
}
