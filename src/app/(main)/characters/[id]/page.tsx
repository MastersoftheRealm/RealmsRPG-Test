/**
 * Character Sheet Page
 * ====================
 * Dynamic route for viewing/editing individual characters.
 * Facade (TASK-666d): orchestration in `use-character-sheet-page`.
 */

'use client';

import { use } from 'react';
import Link from 'next/link';
import { LoadingState, PageContainer, PageHeader } from '@/components/ui';
import {
  SheetHeader,
  SheetActionToolbar,
  CharacterSheetProvider,
  CharacterSheetSettingsModal,
  CharacterSheetBody,
  CharacterSheetColumn,
  CHARACTER_SHEET_MOBILE_DOCK_SCOPE_CLASSNAME,
  CHARACTER_SHEET_MOBILE_FRAME_CLASSNAME,
} from '@/components/character-sheet';
import { RollLog, RollProvider } from '@/components/rolls';
import { SheetTourOfferModal, SheetTour, LevelUpGuideCard } from '@/components/onboarding';
import { CharacterSheetModals } from './CharacterSheetModals';
import { useCharacterSheetPage } from './use-character-sheet-page';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function CharacterSheetPage({ params }: PageParams) {
  const { id } = use(params);
  const model = useCharacterSheetPage(id);

  if (model.authLoading || model.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState message="Loading character..." size="lg" />
      </div>
    );
  }

  if (model.error || !model.character) {
    return (
      <PageContainer
        size="md"
        className="flex min-h-[60vh] flex-col items-center justify-center text-center"
      >
        <PageHeader
          title={model.error || 'Character not found'}
          size="sm"
          className="mb-4 w-full [&_button]:mx-auto [&_h1]:justify-center"
        />
        <Link href="/characters" className="text-primary-link-fg hover:text-primary-fg-hover">
          ← Back to Characters
        </Link>
      </PageContainer>
    );
  }

  const {
    character,
    setCharacter,
    isEditMode,
    effectiveEditMode,
    isTempModifierMode,
    sheetEditNotification,
    hasTempModifiers,
    isOwner,
    isInCampaign,
    campaignContext,
    calculatedStats,
    characterForDisplay,
    archetypeProgression,
    sheetContextValue,
    uploadingPortrait,
    portraitRefreshKey,
    showSettingsModal,
    setShowSettingsModal,
    setShowLevelUpModal,
    setShowRecoveryModal,
    showSheetTourOffer,
    setSheetTourOfferLatched,
    sheetTourActive,
    setSheetTourActive,
    sheetTourRestartKey,
    handleRetakeSheetTour,
    levelUpGuide,
    setLevelUpGuide,
    handleToggleEditMode,
    handleToggleTempModifierMode,
    handleHealthChange,
    handleEnergyChange,
    handleActionPointsChange,
    handleExperienceChange,
    handleNameChange,
    handlePortraitChange,
    handlePortraitUrlChange,
    handleHealthPointsChange,
    handleEnergyPointsChange,
    handleSettingsConfirmVisibility,
    handleSettingsConfirm,
  } = model;

  return (
    <RollProvider campaignContext={campaignContext} canRoll={isOwner}>
      <CharacterSheetProvider value={sheetContextValue!}>
        <div
          className={`bg-background md:min-h-screen ${CHARACTER_SHEET_MOBILE_DOCK_SCOPE_CLASSNAME}`}
        >
          <SheetActionToolbar
            isEditMode={isEditMode}
            isTempModifierMode={isTempModifierMode}
            sheetEditNotification={sheetEditNotification}
            hasTempModifiers={hasTempModifiers}
            onToggleEditMode={handleToggleEditMode}
            onToggleTempModifierMode={handleToggleTempModifierMode}
            onRecovery={() => setShowRecoveryModal(true)}
            onLevelUp={() => setShowLevelUpModal(true)}
            onSettings={isOwner ? () => setShowSettingsModal(true) : undefined}
            canEdit={isOwner}
          />

          {showSettingsModal && (
            <CharacterSheetSettingsModal
              isOpen
              onClose={() => setShowSettingsModal(false)}
              visibility={character.visibility}
              onVisibilityChange={(v) =>
                setCharacter((prev) => (prev ? { ...prev, visibility: v } : null))
              }
              onConfirmVisibility={handleSettingsConfirmVisibility}
              speedDisplayUnit={character.speedDisplayUnit ?? 'spaces'}
              onSpeedDisplayUnitChange={(u) =>
                setCharacter((prev) => (prev ? { ...prev, speedDisplayUnit: u } : null))
              }
              onConfirm={handleSettingsConfirm}
              canEdit={isOwner}
              isInCampaign={isInCampaign}
              onTakeSheetTour={isOwner ? handleRetakeSheetTour : undefined}
            />
          )}

          <div className={CHARACTER_SHEET_MOBILE_FRAME_CLASSNAME}>
            <PageContainer
              size="tool"
              padded={false}
              centered={false}
              className="pt-4 max-md:flex max-md:min-h-0 max-md:w-full max-md:min-w-0 max-md:flex-1 max-md:flex-col md:mx-auto"
            >
              {calculatedStats && (
                <CharacterSheetColumn>
                  <SheetHeader
                    character={characterForDisplay ?? character}
                    calculatedStats={calculatedStats}
                    isEditMode={effectiveEditMode}
                    onHealthChange={handleHealthChange}
                    onEnergyChange={handleEnergyChange}
                    onActionPointsChange={handleActionPointsChange}
                    onHealthPointsChange={handleHealthPointsChange}
                    onEnergyPointsChange={handleEnergyPointsChange}
                    onPortraitChange={handlePortraitChange}
                    onPortraitUrlChange={handlePortraitUrlChange}
                    isUploadingPortrait={uploadingPortrait}
                    portraitRefreshKey={portraitRefreshKey}
                    onNameChange={effectiveEditMode ? handleNameChange : undefined}
                    onExperienceChange={handleExperienceChange}
                    speedDisplayUnit={character.speedDisplayUnit ?? 'spaces'}
                    innateThreshold={archetypeProgression?.innateThreshold || 0}
                    innatePools={archetypeProgression?.innatePools || 0}
                    onEditArchetype={
                      effectiveEditMode ? () => sheetContextValue!.onEditArchetype() : undefined
                    }
                    onEditSpecies={
                      effectiveEditMode ? () => sheetContextValue!.onEditSpecies() : undefined
                    }
                  />

                  <CharacterSheetBody />
                </CharacterSheetColumn>
              )}
            </PageContainer>
          </div>

          <RollLog />
          <CharacterSheetModals />
          <SheetTourOfferModal
            isOpen={showSheetTourOffer}
            onStart={() => {
              setSheetTourOfferLatched(false);
              setSheetTourActive(true);
            }}
            onDismiss={() => setSheetTourOfferLatched(false)}
          />
          <SheetTour
            key={sheetTourRestartKey}
            active={sheetTourActive}
            onComplete={() => setSheetTourActive(false)}
          />
          <LevelUpGuideCard content={levelUpGuide} onClose={() => setLevelUpGuide(null)} />
        </div>
      </CharacterSheetProvider>
    </RollProvider>
  );
}
