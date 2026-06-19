/**
 * Character Sheet Page
 * ====================
 * Dynamic route for viewing/editing individual characters
 */

'use client';

import { use, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { getCharacter, saveCharacter, type LibraryForView } from '@/services/character-service';
import { useAuth, useAutoSave, useCampaignsFull, useCharacterResourceSync, useUserPowers, useUserTechniques, useUserEmpoweredTechniques, useUserItems, useTraits, usePowerParts, useTechniqueParts, useItemProperties, useMergedSpecies, useCodexFeats, useCodexSkills, useCodexArchetypes, useEquipment, useOfficialLibrary } from '@/hooks';
import { useGameRules } from '@/hooks/use-game-rules';
import { LoadingState } from '@/components/ui';
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
} from '@/components/character-sheet';
import { useToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
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
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [libraryForView, setLibraryForView] = useState<LibraryForView | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [addModalType, setAddModalType] = useState<AddModalType>(null);
  const [libraryActiveTab, setLibraryActiveTab] = useState<CharacterLibraryTabId>('feats');
  const [featModalType, setFeatModalType] = useState<FeatModalType>(null);
  const [skillModalType, setSkillModalType] = useState<SkillModalType>(null);
  const [featToRemove, setFeatToRemove] = useState<{ id: string; name: string } | null>(null);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [portraitRefreshKey, setPortraitRefreshKey] = useState<number | null>(null);
  const [showEditArchetypeModal, setShowEditArchetypeModal] = useState(false);
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
  const publicLibraries = useMemo(() => {
    const powers = (publicPowersRaw as Record<string, unknown>[]).map((p) => ({
      id: String(p.id ?? p.docId ?? ''),
      docId: String(p.id ?? p.docId ?? ''),
      name: String(p.name ?? ''),
      description: String(p.description ?? ''),
      parts: p.parts ?? [],
      actionType: p.actionType,
      isReaction: !!p.isReaction,
      range: p.range,
      area: p.area,
      duration: p.duration,
      damage: p.damage,
    }));
    const techniques = [...(publicTechniquesRaw as Record<string, unknown>[]), ...(publicEmpoweredTechniquesRaw as Record<string, unknown>[])].map((t) => ({
      id: String(t.id ?? t.docId ?? ''),
      docId: String(t.id ?? t.docId ?? ''),
      name: String(t.name ?? ''),
      description: String(t.description ?? ''),
      parts: t.parts ?? [],
      weapon: t.weapon,
      damage: t.damage,
    }));
    const items = (publicItemsRaw as Record<string, unknown>[]).map((i) => ({
      id: String(i.id ?? i.docId ?? ''),
      docId: String(i.id ?? i.docId ?? ''),
      name: String(i.name ?? ''),
      description: String(i.description ?? ''),
      type: (i.type as string) || 'weapon',
      properties: i.properties ?? [],
      damage: i.damage,
      armorValue: i.armorValue,
    }));
    return { powers, techniques, items } as { powers: import('@/hooks/use-user-library').UserPower[]; techniques: import('@/hooks/use-user-library').UserTechnique[]; items: import('@/hooks/use-user-library').UserItem[] };
  }, [publicPowersRaw, publicTechniquesRaw, publicEmpoweredTechniquesRaw, publicItemsRaw]);
  
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
  }, [campaignsFull, user?.uid, character]);

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
      } catch (err) {
        setError('Failed to load character');
      } finally {
        setLoading(false);
      }
    }

    loadCharacter();
  }, [id, authLoading]);

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
          setCharacter(prev => {
            if (!prev || prev.id !== payload.new.id) return prev;
            const updates: Partial<Character> = {};
            if (typeof data.currentHealth === 'number') updates.currentHealth = data.currentHealth;
            if (typeof data.currentEnergy === 'number') updates.currentEnergy = data.currentEnergy;
            if (typeof data.actionPoints === 'number') updates.actionPoints = data.actionPoints;
            const health = data.health as { current?: number; max?: number } | undefined;
            const energy = data.energy as { current?: number; max?: number } | undefined;
            if (health && typeof health.current === 'number') {
              updates.currentHealth = health.current;
              if (typeof health.max === 'number') updates.health = { ...prev.health, current: health.current, max: health.max } as Character['health'];
            }
            if (energy && typeof energy.current === 'number') {
              updates.currentEnergy = energy.current;
              if (typeof energy.max === 'number') updates.energy = { ...prev.energy, current: energy.current, max: energy.max } as Character['energy'];
            }
            if (Object.keys(updates).length === 0) return prev;
            return { ...prev, ...updates };
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

  useCharacterResourceSync(character, isOwner);

  /** Apply path level-5 proficiency floor when loading an existing path character (TASK-368). */
  const pathProfAppliedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!character || codexArchetypes.length === 0) return;
    const level = character.level ?? 1;
    if (level < 5) return;
    const applyKey = `${character.id}:${level}:${character.pow_prof ?? 0}:${character.mart_prof ?? 0}`;
    if (pathProfAppliedKeyRef.current === applyKey) return;

    const lookupId = getArchetypeCodexLookupId(character);
    if (!lookupId) return;
    const pathArch = codexArchetypes.find((a) => a.id === lookupId) as Character['archetype'] | undefined;
    const profUpdate = applyPathProficiencyForLevel(character, level, pathArch ?? character.archetype);
    if (!profUpdate) {
      pathProfAppliedKeyRef.current = applyKey;
      return;
    }

    pathProfAppliedKeyRef.current = applyKey;
    setCharacter((prev) => (prev ? { ...prev, ...profUpdate } : null));
  }, [character, codexArchetypes]);

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
    handleAbilityChange,
    handleDefenseChange,
    handleHealthPointsChange,
    handleEnergyPointsChange,
    handleFullRecovery,
    handlePartialRecovery,
    handleLevelUp,
    existingIds,
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
            onSkillChange: handleSkillChange,
            onRemoveSkill: handleRemoveSkill,
            onAddSkill: () => setSkillModalType('skill'),
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
      handleAbilityChange,
      handleDefenseChange,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {error || 'Character not found'}
          </h1>
          <Link
            href="/characters"
            className="text-primary-600 hover:text-primary-700"
          >
            ← Back to Characters
          </Link>
        </div>
      </div>
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
            isOpen={showSettingsModal}
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
        <div className="max-w-[1600px] mx-auto px-4 pt-4">
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
        </div>
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
          existingIds={existingIds}
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
          onArchetypeSave={handleArchetypeSave}
          showEditSpeciesModal={showEditSpeciesModal}
          setShowEditSpeciesModal={setShowEditSpeciesModal}
          onSpeciesSave={handleEditSpeciesSave}
        />
        </div>
      </CharacterSheetProvider>
    </RollProvider>
  );
}
