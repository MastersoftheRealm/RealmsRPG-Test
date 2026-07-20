/**
 * Character Sheet Page
 * ====================
 * Dynamic route for viewing/editing individual characters
 */

'use client';

import { use, useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getCharacter, saveCharacter, type LibraryForView } from '@/services/character-service';
import { useAuth, useAutoSave, useCampaignsFull, useCharacterResourceSync, useUserPowers, useUserTechniques, useUserEmpoweredTechniques, useUserItems, useTraits, usePowerParts, useTechniqueParts, useItemProperties, useMergedSpecies, useCodexFeats, useCodexSkills, useCodexArchetypes, useEquipment, useOfficialLibrary } from '@/hooks';
import { useGameRules } from '@/hooks/use-game-rules';
import { LoadingState, PageContainer, PageHeader } from '@/components/ui';
import { cleanForSave } from '@/lib/data-enrichment';
import { getArchetypeCodexLookupId, applyPathProficiencyForLevel } from '@/lib/game/archetype-display';
import {
  SheetHeader,
  RollLog,
  RollProvider,
  SheetActionToolbar,
  CharacterSheetProvider,
  CharacterSheetSettingsModal,
  CharacterSheetBody,
  useCharacterSheetDerived,
  buildCharacterSheetLibraryProps,
  useCharacterSheetActions,
  resolveLibraryActiveTab,
} from '@/components/character-sheet';
import {
  SheetTourOfferModal,
  SheetTour,
  LevelUpGuideCard,
} from '@/components/onboarding';
import { buildLevelUpGuideContent, type LevelUpGuideContent } from '@/lib/level-up-guide';
import { shouldOfferSheetTour } from '@/lib/onboarding-preferences';
import { useToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
  mergeResourceUpdatesIntoCharacter,
  shouldSuppressRemoteResourceMerge,
} from '@/lib/encounter/character-resource-sync';
import type {
  Character,
  CharacterLibraryTabId,
} from '@/types';
import { CharacterSheetModals, type AddModalType, type FeatModalType, type SkillModalType } from './CharacterSheetModals';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function CharacterSheetPage({ params }: PageParams) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { rules } = useGameRules();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [libraryForView, setLibraryForView] = useState<LibraryForView | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sheetTourOfferLatched, setSheetTourOfferLatched] = useState(false);
  const [sheetTourActive, setSheetTourActive] = useState(false);
  const [levelUpGuide, setLevelUpGuide] = useState<LevelUpGuideContent | null>(null);
  const [addModalType, setAddModalType] = useState<AddModalType>(null);
  const [libraryActiveTab, setLibraryActiveTab] = useState<CharacterLibraryTabId>('feats');
  const [featModalType, setFeatModalType] = useState<FeatModalType>(null);
  const [skillModalType, setSkillModalType] = useState<SkillModalType>(null);
  const [featToRemove, setFeatToRemove] = useState<{ id: string; name: string } | null>(null);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [portraitRefreshKey, setPortraitRefreshKey] = useState<number | null>(null);
  const [showEditArchetypeModal, setShowEditArchetypeModalState] = useState(false);
  const [editArchetypeSessionKey, setEditArchetypeSessionKey] = useState(0);
  const setShowEditArchetypeModal = useCallback((open: boolean) => {
    if (open) setEditArchetypeSessionKey((k) => k + 1);
    setShowEditArchetypeModalState(open);
  }, []);
  const [showEditSpeciesModal, setShowEditSpeciesModal] = useState(false);
  
  // Fetch user's library for data enrichment
  const { data: userPowers = [] } = useUserPowers();
  const { data: userTechniques = [] } = useUserTechniques();
  const { data: userEmpoweredTechniques = [] } = useUserEmpoweredTechniques();
  const { data: userItems = [] } = useUserItems();
  const { data: traitsDb = [] } = useTraits();
  const { data: featsDb = [] } = useCodexFeats();
  
  // Codex parts data for enrichment (descriptions, TP costs)
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  
  // Codex equipment for enrichment fallback
  const { data: codexEquipment = [] } = useEquipment();
  
  // Public library for enrichment fallback (character can reference public items without copying to user library)
  const { data: publicPowersRaw = [] } = useOfficialLibrary('powers');
  const { data: publicTechniquesRaw = [] } = useOfficialLibrary('techniques');
  const { data: publicEmpoweredTechniquesRaw = [] } = useOfficialLibrary('empowered-techniques');
  const { data: publicItemsRaw = [] } = useOfficialLibrary('items');
  const publicLibraries = useMemo(
    () => ({
      powers: publicPowersRaw,
      techniques: [...publicTechniquesRaw, ...publicEmpoweredTechniquesRaw],
      items: publicItemsRaw,
    }),
    [publicPowersRaw, publicTechniquesRaw, publicEmpoweredTechniquesRaw, publicItemsRaw]
  );
  
  // Fetch all species data to look up species traits
  const { data: allSpecies = [] } = useMergedSpecies();
  
  // Fetch all Codex skills to get ability options for each skill
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: codexArchetypes = [] } = useCodexArchetypes();

  // Campaigns (for roll log context when character is in a campaign)
  const { data: campaignsFull = [] } = useCampaignsFull();
  const campaignContext = useMemo(() => {
    if (!user?.uid || !character) return undefined;
    const campaign = campaignsFull.find((c) =>
      c.characters?.some((cc) => cc.userId === user.uid && cc.characterId === character.id)
    );
    if (!campaign) return undefined;
    return {
      campaignId: campaign.id,
      characterId: character.id,
      characterName: character.name,
    };
  }, [campaignsFull, user, character]);

  const isInCampaign = useMemo(
    () =>
      !!character &&
      campaignsFull.some((c) =>
        (c.characters || []).some(
          (cc) => cc.characterId === character.id && cc.userId === character.userId
        )
      ),
    [character, campaignsFull]
  );

  const {
    enrichedData,
    characterSpeciesTraits,
    characterSpeciesSkills,
    characterForDisplay,
    calculatedStats,
    pointBudgets,
    archetypeProgression,
    hasUnappliedPoints,
    skills,
    stateFeatsList,
    stateUsesMax,
    stateUsesCurrent,
    archetypeFeatsForDisplay,
    characterFeatsForDisplay,
  } = useCharacterSheetDerived({
    character,
    libraryForView,
    userPowers,
    userTechniques,
    userEmpoweredTechniques,
    userItems,
    codexEquipment,
    powerPartsDb,
    techniquePartsDb,
    itemPropertiesDb,
    publicLibraries,
    allSpecies,
    traitsDb,
    codexSkills,
    codexArchetypes,
    featsDb,
    rules,
  });
  
  // Load character data (works for owner, public link, or campaign view)
  useEffect(() => {
    async function loadCharacter() {
      if (authLoading) return;

      try {
        setLoading(true);
        setError(null);
        const data = await getCharacter(id);
        if (!data.character) {
          setError('Character not found');
          return;
        }
        setCharacter(data.character);
        setLibraryForView(data.libraryForView);
      } catch {
        setError('Failed to load character');
      } finally {
        setLoading(false);
      }
    }

    loadCharacter();
  }, [id, authLoading]);

  // Tab title: CharacterName | RealmsRPG (matches root title.template); fallback while loading/error
  useEffect(() => {
    const previousTitle = document.title;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    // Prefer fallback while loading/error so soft-nav between ids doesn't leave a stale name
    document.title =
      !loading && !error && character?.name
        ? `${character.name} | RealmsRPG`
        : 'Characters | RealmsRPG';
  }, [character?.name, loading, error]);

  // Realtime: when this character is updated (e.g. from encounter tracker), sync HP/EN/AP to local state
  useEffect(() => {
    if (!character?.id) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`character:${character.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${character.id}`,
        },
        (payload: { new: { id: string; data?: Record<string, unknown> } }) => {
          const data = payload.new?.data;
          if (!data) return;
          const charId = payload.new.id;
          if (shouldSuppressRemoteResourceMerge(charId)) return;
          setCharacter(prev => {
            if (!prev || prev.id !== charId) return prev;
            return mergeResourceUpdatesIntoCharacter(prev, data) ?? prev;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [character?.id]);
  
  const isOwner = Boolean(character && user && character.userId === user.uid);
  const effectiveEditMode = isEditMode && isOwner;

  // Keep controlled library tab in sync when visibility hides the active tab (TASK-430 parity).
  if (character) {
    const resolvedLibraryTab = resolveLibraryActiveTab(libraryActiveTab, {
      isEditMode: effectiveEditMode,
      tabVisibility: character.libraryTabVisibility,
    });
    if (resolvedLibraryTab !== libraryActiveTab) {
      setLibraryActiveTab(resolvedLibraryTab);
    }
  }

  useCharacterResourceSync(character, isOwner);

  /** Apply path level-5 proficiency floor when loading an existing path character (TASK-368). */
  const [pathProfAppliedKey, setPathProfAppliedKey] = useState<string | null>(null);
  if (character && codexArchetypes.length > 0) {
    const level = character.level ?? 1;
    if (level >= 5) {
      const applyKey = `${character.id}:${level}:${character.pow_prof ?? 0}:${character.mart_prof ?? 0}`;
      if (pathProfAppliedKey !== applyKey) {
        const lookupId = getArchetypeCodexLookupId(character);
        if (lookupId) {
          const pathArch = codexArchetypes.find((a) => a.id === lookupId) as
            | Character['archetype']
            | undefined;
          const profUpdate = applyPathProficiencyForLevel(
            character,
            level,
            pathArch ?? character.archetype
          );
          if (profUpdate) {
            const next = { ...character, ...profUpdate };
            setPathProfAppliedKey(
              `${next.id}:${level}:${next.pow_prof ?? 0}:${next.mart_prof ?? 0}`
            );
            setCharacter(next);
          } else {
            setPathProfAppliedKey(applyKey);
          }
        } else {
          setPathProfAppliedKey(applyKey);
        }
      }
    }
  }

  // Auto-save with debounce — enabled for **owners in any mode**.
  // HP / energy / AP (and XP) can be changed while *not* in sheet edit mode; previously `enabled: effectiveEditMode`
  // blocked autosave, so current HP appeared to work until refresh.
  const { hasUnsavedChanges, saveNow } = useAutoSave({
    data: character,
    onSave: async (data) => {
      if (!user || !data) return;
      const cleanedData = cleanForSave(data);
      await saveCharacter(id, cleanedData);
    },
    delay: 2000,
    enabled: isOwner,
    onSaveError: () => {
      showToast('Failed to save character', 'error');
    },
  });
  
  // Save when leaving edit mode
  const handleToggleEditMode = useCallback(async () => {
    if (isEditMode && hasUnsavedChanges) {
      await saveNow();
    }
    setIsEditMode(!isEditMode);
  }, [isEditMode, hasUnsavedChanges, saveNow]);
  
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
  });

  // Post-save sheet tour offer (?offerTour=1 from creator handoff).
  const urlWantsTourOffer = searchParams.get('offerTour') === '1';
  if (urlWantsTourOffer && shouldOfferSheetTour() && !sheetTourOfferLatched) {
    setSheetTourOfferLatched(true);
  }
  const showSheetTourOffer = sheetTourOfferLatched;
  useEffect(() => {
    if (!urlWantsTourOffer) return;
    router.replace(pathname, { scroll: false });
  }, [urlWantsTourOffer, router, pathname]);

  const handleLevelUp = useCallback(
    (newLevel: number) => {
      if (!character) return;
      const previousLevel = character.level || 1;
      applyLevelUp(newLevel);
      const guide = buildLevelUpGuideContent(character, previousLevel, newLevel, rules);
      if (guide) {
        if (guide.enterEditMode) setIsEditMode(true);
        setLevelUpGuide(guide);
      }
    },
    [character, applyLevelUp, rules]
  );

  const librarySectionProps = useMemo(() => {
    if (!character || !calculatedStats) return null;
    return buildCharacterSheetLibraryProps({
      character,
      enrichedData,
      archetypeProgression,
      calculatedMaxEnergy: calculatedStats.maxEnergy,
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
      handlers: libraryHandlers,
    });
  }, [
    character,
    calculatedStats,
    enrichedData,
    archetypeProgression,
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
    libraryHandlers,
  ]);
  
  // Sheet context for CharacterSheetProvider. Must be before any early return so hook count is stable (React #310).
  const sheetContextValue = useMemo(
    () =>
      character
        ? {
            character,
            setCharacter,
            isEditMode: effectiveEditMode,
            isOwner,
            setAddModalType,
            setFeatModalType,
            setSkillModalType,
            skills,
            pointBudgets,
            enrichedData,
            librarySectionProps,
            characterSpeciesSkills,
            libraryActiveTab,
            setLibraryActiveTab,
            onAbilityChange: handleAbilityChange,
            onDefenseChange: handleDefenseChange,
            onTempModifiersChange: handleTempModifiersChange,
            onSkillChange: handleSkillChange,
            onRemoveSkill: handleRemoveSkill,
            onAddSubSkill: () => setSkillModalType('subskill'),
            onMartialProfChange: handleMartialProfChange,
            onPowerProfChange: handlePowerProfChange,
            onMilestoneChoiceChange: handleMilestoneChoiceChange,
            onEditArchetype: () => {
              if (effectiveEditMode) setShowEditArchetypeModal(true);
            },
            onEditSpecies: () => {
              if (effectiveEditMode) setShowEditSpeciesModal(true);
            },
          }
        : null,
    [
      character,
      effectiveEditMode,
      isOwner,
      skills,
      pointBudgets,
      enrichedData,
      librarySectionProps,
      characterSpeciesSkills,
      libraryActiveTab,
      setAddModalType,
      setFeatModalType,
      setSkillModalType,
      setLibraryActiveTab,
      setShowEditArchetypeModal,
      setShowEditSpeciesModal,
      handleAbilityChange,
      handleDefenseChange,
      handleTempModifiersChange,
      handleSkillChange,
      handleRemoveSkill,
      handleMartialProfChange,
      handlePowerProfChange,
      handleMilestoneChoiceChange,
      setCharacter,
    ]
  );
  
  // Note: No auth redirect — this page supports public/campaign character viewing.
  // The API enforces visibility rules; owners get edit controls via `isOwner`.
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading character..." size="lg" />
      </div>
    );
  }
  
  if (error || !character) {
    return (
      <PageContainer size="md" className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <PageHeader
          title={error || 'Character not found'}
          size="sm"
          className="mb-4 w-full [&_h1]:justify-center [&_button]:mx-auto"
        />
        <Link
          href="/characters"
          className="text-primary-link-fg hover:text-primary-fg-hover"
        >
          ← Back to Characters
        </Link>
      </PageContainer>
    );
  }

  return (
    <RollProvider campaignContext={campaignContext} canRoll={isOwner}>
      <CharacterSheetProvider value={sheetContextValue!}>
        <div className="min-h-screen bg-background pb-8">
        {/* Floating Action Toolbar */}
        <SheetActionToolbar
          isEditMode={isEditMode}
          hasUnappliedPoints={hasUnappliedPoints}
          onToggleEditMode={handleToggleEditMode}
          onRecovery={() => setShowRecoveryModal(true)}
          onLevelUp={() => setShowLevelUpModal(true)}
          onSettings={isOwner ? () => setShowSettingsModal(true) : undefined}
          canEdit={isOwner}
        />

        {showSettingsModal && character && (
          <CharacterSheetSettingsModal
            isOpen
            onClose={() => setShowSettingsModal(false)}
            visibility={character.visibility}
            onVisibilityChange={(v) => setCharacter(prev => prev ? { ...prev, visibility: v } : null)}
            onConfirmVisibility={async (v) => {
              setCharacter(prev => prev ? { ...prev, visibility: v } : null);
              const payload = cleanForSave({ ...character, visibility: v });
              await saveCharacter(id, payload);
              const label = v === 'public' ? 'Public' : v === 'private' ? 'Private' : 'Campaign';
              showToast(`Visibility set to ${label}.`, 'success');
              setShowSettingsModal(false);
            }}
            speedDisplayUnit={character.speedDisplayUnit ?? 'spaces'}
            onSpeedDisplayUnitChange={(u) => setCharacter(prev => prev ? { ...prev, speedDisplayUnit: u } : null)}
            onConfirm={async (updates) => {
              const next = { ...character, ...updates };
              setCharacter(prev => prev ? { ...prev, ...updates } : null);
              const payload = cleanForSave(next);
              await saveCharacter(id, payload);
              if (updates.visibility) {
                const label = updates.visibility === 'public' ? 'Public' : updates.visibility === 'private' ? 'Private' : 'Campaign';
                showToast(`Visibility set to ${label}.`, 'success');
              }
              if (updates.speedDisplayUnit) {
                const unitLabel = updates.speedDisplayUnit === 'feet' ? 'feet' : updates.speedDisplayUnit === 'meters' ? 'meters' : 'spaces';
                showToast(`Speed display set to ${unitLabel}.`, 'success');
              }
              setShowSettingsModal(false);
            }}
            canEdit={isOwner}
            isInCampaign={isInCampaign}
          />
        )}
        
        {/* Character Sheet Content */}
        <PageContainer size="tool" padded={false} className="pt-4">
          <div className="mb-2 flex justify-end">
          </div>
          {calculatedStats && (
            <>
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
                speedBase={character.speedBase ?? 6}
                evasionBase={character.evasionBase ?? 10}
                onSpeedBaseChange={(v: number) => setCharacter(prev => prev ? { ...prev, speedBase: v } : null)}
                onEvasionBaseChange={(v: number) => setCharacter(prev => prev ? { ...prev, evasionBase: v } : null)}
                speedDisplayUnit={character.speedDisplayUnit ?? 'spaces'}
                innateThreshold={archetypeProgression?.innateThreshold || 0}
                innatePools={archetypeProgression?.innatePools || 0}
                onEditArchetype={effectiveEditMode ? () => setShowEditArchetypeModal(true) : undefined}
                onEditSpecies={effectiveEditMode ? () => setShowEditSpeciesModal(true) : undefined}
              />
              
              <CharacterSheetBody />
          </>
        )}
        </PageContainer>
        <RollLog />
        <CharacterSheetModals
          addModalType={addModalType}
          setAddModalType={setAddModalType}
          featModalType={featModalType}
          setFeatModalType={setFeatModalType}
          skillModalType={skillModalType}
          setSkillModalType={setSkillModalType}
          featToRemove={featToRemove}
          setFeatToRemove={setFeatToRemove}
          showLevelUpModal={showLevelUpModal}
          setShowLevelUpModal={setShowLevelUpModal}
          showRecoveryModal={showRecoveryModal}
          setShowRecoveryModal={setShowRecoveryModal}
          character={character}
          displayCharacter={characterForDisplay}
          calculatedStats={calculatedStats}
          skills={skills}
          traitsDb={traitsDb}
          onModalAdd={handleModalAdd}
          onAddFeats={handleAddFeats}
          onAddSkills={handleAddSkills}
          onConfirmRemoveFeat={handleConfirmRemoveFeat}
          onLevelUp={handleLevelUp}
          onFullRecovery={handleFullRecovery}
          onPartialRecovery={handlePartialRecovery}
          showEditArchetypeModal={showEditArchetypeModal}
          setShowEditArchetypeModal={setShowEditArchetypeModal}
          editArchetypeSessionKey={editArchetypeSessionKey}
          onArchetypeSave={handleArchetypeSave}
          showEditSpeciesModal={showEditSpeciesModal}
          setShowEditSpeciesModal={setShowEditSpeciesModal}
          onSpeciesSave={handleEditSpeciesSave}
        />
        <SheetTourOfferModal
          isOpen={showSheetTourOffer}
          onStart={() => {
            setSheetTourOfferLatched(false);
            setSheetTourActive(true);
          }}
          onDismiss={() => setSheetTourOfferLatched(false)}
        />
        <SheetTour active={sheetTourActive} onComplete={() => setSheetTourActive(false)} />
        <LevelUpGuideCard content={levelUpGuide} onClose={() => setLevelUpGuide(null)} />
        </div>
      </CharacterSheetProvider>
    </RollProvider>
  );
}
