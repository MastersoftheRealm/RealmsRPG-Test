/**
 * Character sheet page data layer (TASK-666d follow-up)
 * =====================================================
 * Load, realtime merge, path proficiency apply, autosave, enrichment hooks,
 * and derived stats. UI chrome lives in `use-character-sheet-page-ui`.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { getCharacter, saveCharacter, type LibraryForView } from '@/services/character-service';
import {
  useAuth,
  useAutoSave,
  useCampaignsFull,
  useCharacterResourceSync,
  useUserPowers,
  useUserTechniques,
  useUserEmpoweredTechniques,
  useUserItems,
  useTraits,
  usePowerParts,
  useTechniqueParts,
  useItemProperties,
  useMergedSpecies,
  useCodexFeats,
  useCodexSkills,
  useCodexArchetypes,
  useEquipment,
  useOfficialLibrary,
} from '@/hooks';
import { useGameRules } from '@/hooks/use-game-rules';
import { cleanForSave } from '@/lib/data-enrichment';
import { getArchetypeCodexLookupId, applyPathProficiencyForLevel } from '@/lib/game/archetype-display';
import { useCharacterSheetDerived } from '@/components/character-sheet';
import { useToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import {
  mergeResourceUpdatesIntoCharacter,
  shouldSuppressRemoteResourceMerge,
} from '@/lib/encounter/character-resource-sync';
import type { Character } from '@/types';

export function useCharacterSheetPageData(id: string) {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { rules } = useGameRules();

  const [character, setCharacter] = useState<Character | null>(null);
  const [libraryForView, setLibraryForView] = useState<LibraryForView | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: userPowers = [] } = useUserPowers();
  const { data: userTechniques = [] } = useUserTechniques();
  const { data: userEmpoweredTechniques = [] } = useUserEmpoweredTechniques();
  const { data: userItems = [] } = useUserItems();
  const { data: traitsDb = [] } = useTraits();
  const { data: featsDb = [] } = useCodexFeats();

  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();

  const { data: codexEquipment = [] } = useEquipment();

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
    [publicPowersRaw, publicTechniquesRaw, publicEmpoweredTechniquesRaw, publicItemsRaw],
  );

  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: codexArchetypes = [] } = useCodexArchetypes();

  const { data: campaignsFull = [] } = useCampaignsFull();
  const campaignContext = useMemo(() => {
    if (!user?.uid || !character) return undefined;
    const campaign = campaignsFull.find((c) =>
      c.characters?.some((cc) => cc.userId === user.uid && cc.characterId === character.id),
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
          (cc) => cc.characterId === character.id && cc.userId === character.userId,
        ),
      ),
    [character, campaignsFull],
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

  useEffect(() => {
    const previousTitle = document.title;
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    document.title =
      !loading && !error && character?.name
        ? `${character.name} | RealmsRPG`
        : 'Characters | RealmsRPG';
  }, [character?.name, loading, error]);

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
          setCharacter((prev) => {
            if (!prev || prev.id !== charId) return prev;
            return mergeResourceUpdatesIntoCharacter(prev, data) ?? prev;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [character?.id]);

  const isOwner = Boolean(character && user && character.userId === user.uid);

  useCharacterResourceSync(character, isOwner);

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
            pathArch ?? character.archetype,
          );
          if (profUpdate) {
            const next = { ...character, ...profUpdate };
            setPathProfAppliedKey(
              `${next.id}:${level}:${next.pow_prof ?? 0}:${next.mart_prof ?? 0}`,
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

  return {
    id,
    user,
    authLoading,
    showToast,
    rules,
    character,
    setCharacter,
    loading,
    error,
    setError,
    isOwner,
    isInCampaign,
    campaignContext,
    hasUnsavedChanges,
    saveNow,
    traitsDb,
    featsDb,
    powerPartsDb,
    techniquePartsDb,
    itemPropertiesDb,
    codexSkills,
    codexArchetypes,
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
  };
}
