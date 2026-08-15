/**
 * Character sheet page data layer (TASK-666d follow-up)
 * =====================================================
 * Load via `useCharacter` (TASK-750), realtime merge, path proficiency apply,
 * autosave, enrichment hooks, and derived stats. UI chrome lives in
 * `use-character-sheet-page-ui`.
 */

'use client';

import { useState, useEffect, useMemo, useRef, useCallback, type SetStateAction } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { saveCharacterWithConflictRetry } from '@/services/character-service';
import {
  characterViewerId,
  patchCharacterDetailQuery,
  useAuth,
  useAutoSave,
  useCampaignsFull,
  useCharacter,
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
import { sheetCatalogFromEnrichment } from '@/lib/character-view-enrichment';
import { cleanForSave } from '@/lib/data-enrichment';
import {
  characterLockToken,
  mergeRemotePreservingDirty,
  pickDirtyCharacterFields,
} from '@/lib/character/dirty-patch';
import { rememberCharacterLockToken } from '@/lib/character/save-lock';
import { mergeSheetRealtimePayload } from '@/lib/character/realtime-merge';
import {
  getArchetypeCodexLookupId,
  applyPathProficiencyForLevel,
} from '@/lib/game/archetype-display';
import { useCharacterSheetDerived } from '@/components/character-sheet';
import { useToast } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { shouldSuppressRemoteResourceMerge } from '@/lib/encounter/character-resource-sync';
import type { Character } from '@/types';

export function useCharacterSheetPageData(id: string) {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const { rules } = useGameRules();
  const queryClient = useQueryClient();
  const viewerKey = characterViewerId(user?.uid);

  const {
    data: characterResult,
    isPending: characterPending,
    isError: characterQueryError,
  } = useCharacter(id, { refetchOnWindowFocus: false });

  const character = characterResult?.character ?? null;
  const libraryForView = characterResult?.libraryForView;
  const enrichment = characterResult?.enrichment;
  const loadCatalog = !characterPending && !enrichment;
  const loading = authLoading || characterPending;
  const [actionError, setError] = useState<string | null>(null);
  const loadError = characterQueryError
    ? 'Failed to load character'
    : !loading && characterResult && !characterResult.character
      ? 'Character not found'
      : null;
  const error = actionError ?? loadError;

  const savedCleanRef = useRef<Record<string, unknown> | null>(null);
  const savedSnapshotIdRef = useRef<string | null>(null);

  const setCharacter = useCallback(
    (update: SetStateAction<Character | null>) => {
      patchCharacterDetailQuery(queryClient, viewerKey, id, update);
    },
    [queryClient, viewerKey, id],
  );

  useEffect(() => {
    if (character?.id === id) {
      if (savedSnapshotIdRef.current === id) return;
      savedSnapshotIdRef.current = id;
      savedCleanRef.current = cleanForSave(character) as Record<string, unknown>;
      rememberCharacterLockToken(id, character.updatedAt);
      return;
    }
    if (savedSnapshotIdRef.current !== id) {
      savedSnapshotIdRef.current = null;
      savedCleanRef.current = null;
    }
  }, [character, id]);

  const { data: userPowers = [] } = useUserPowers({ enabled: loadCatalog });
  const { data: userTechniques = [] } = useUserTechniques({ enabled: loadCatalog });
  const { data: userEmpoweredTechniques = [] } = useUserEmpoweredTechniques({
    enabled: loadCatalog,
  });
  const { data: userItems = [] } = useUserItems({ enabled: loadCatalog });
  const { data: traitsDb = [] } = useTraits({ enabled: loadCatalog });
  const { data: featsDb = [] } = useCodexFeats({ enabled: loadCatalog });

  const { data: powerPartsDb = [] } = usePowerParts({ enabled: loadCatalog });
  const { data: techniquePartsDb = [] } = useTechniqueParts({ enabled: loadCatalog });
  const { data: itemPropertiesDb = [] } = useItemProperties({ enabled: loadCatalog });

  const { data: codexEquipment = [] } = useEquipment({ enabled: loadCatalog });

  const { data: publicPowersRaw = [] } = useOfficialLibrary('powers', { enabled: loadCatalog });
  const { data: publicTechniquesRaw = [] } = useOfficialLibrary('techniques', {
    enabled: loadCatalog,
  });
  const { data: publicEmpoweredTechniquesRaw = [] } = useOfficialLibrary('empowered-techniques', {
    enabled: loadCatalog,
  });
  const { data: publicItemsRaw = [] } = useOfficialLibrary('items', { enabled: loadCatalog });
  const hookPublicLibraries = useMemo(
    () => ({
      powers: publicPowersRaw,
      techniques: [...publicTechniquesRaw, ...publicEmpoweredTechniquesRaw],
      items: publicItemsRaw,
    }),
    [publicPowersRaw, publicTechniquesRaw, publicEmpoweredTechniquesRaw, publicItemsRaw],
  );

  const { data: allSpecies = [] } = useMergedSpecies({ enabled: loadCatalog });
  const { data: codexSkills = [] } = useCodexSkills({ enabled: loadCatalog });
  const { data: codexArchetypes = [] } = useCodexArchetypes({ enabled: loadCatalog });

  const catalog = enrichment
    ? sheetCatalogFromEnrichment(enrichment)
    : {
        userPowers,
        userTechniques,
        userEmpoweredTechniques,
        userItems,
        publicLibraries: hookPublicLibraries,
        codexEquipment,
        powerPartsDb,
        techniquePartsDb,
        itemPropertiesDb,
        allSpecies,
        traitsDb,
        codexSkills,
        codexArchetypes,
        featsDb,
      };

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
    ...catalog,
    rules,
  });

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
        (payload: {
          new: { id: string; data?: Record<string, unknown>; updated_at?: string | null };
        }) => {
          const data = payload.new?.data;
          if (!data) return;
          const charId = payload.new.id;
          rememberCharacterLockToken(charId, payload.new.updated_at);
          const suppressResources = shouldSuppressRemoteResourceMerge(charId);
          setCharacter((prev) => {
            if (!prev || prev.id !== charId) return prev;
            const { character: next, nextBaseline } = mergeSheetRealtimePayload(
              prev,
              data,
              savedCleanRef.current,
              {
                suppressResources,
                updatedAt: payload.new.updated_at,
              },
            );
            if (nextBaseline) {
              const baseline = nextBaseline;
              // Defer so Strict Mode's double updater both read the same savedCleanRef.
              queueMicrotask(() => {
                savedCleanRef.current = baseline;
              });
            }
            return next;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [character?.id, setCharacter]);

  const isOwner = Boolean(character && user && character.userId === user.uid);

  useCharacterResourceSync(character, isOwner);

  const pathProfAppliedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!character || catalog.codexArchetypes.length === 0) return;
    const level = character.level ?? 1;
    if (level < 5) return;
    const applyKey = `${character.id}:${level}:${character.pow_prof ?? 0}:${character.mart_prof ?? 0}`;
    if (pathProfAppliedKeyRef.current === applyKey) return;
    const lookupId = getArchetypeCodexLookupId(character);
    if (!lookupId) {
      pathProfAppliedKeyRef.current = applyKey;
      return;
    }
    const pathArch = catalog.codexArchetypes.find((a) => a.id === lookupId) as
      | Character['archetype']
      | undefined;
    const profUpdate = applyPathProficiencyForLevel(
      character,
      level,
      pathArch ?? character.archetype,
    );
    if (profUpdate) {
      const next = { ...character, ...profUpdate };
      pathProfAppliedKeyRef.current = `${next.id}:${level}:${next.pow_prof ?? 0}:${next.mart_prof ?? 0}`;
      setCharacter(next);
    } else {
      pathProfAppliedKeyRef.current = applyKey;
    }
  }, [character, catalog.codexArchetypes, setCharacter]);

  const { hasUnsavedChanges, saveNow } = useAutoSave({
    data: character,
    onSave: async (data) => {
      if (!user || !data) return;
      const cleaned = cleanForSave(data) as Record<string, unknown>;
      const dirty = pickDirtyCharacterFields(cleaned, savedCleanRef.current);
      if (Object.keys(dirty).length === 0) {
        savedCleanRef.current = cleaned;
        return;
      }
      const mergedCleanRef: { current: Record<string, unknown> | null } = { current: null };
      const result = await saveCharacterWithConflictRetry(id, dirty as Partial<Character>, {
        updatedAt: characterLockToken(data.updatedAt),
        mergeOnConflict: (remote) => {
          const remoteClean = cleanForSave(remote) as Record<string, unknown>;
          const mergedClean = mergeRemotePreservingDirty(remoteClean, cleaned, Object.keys(dirty));
          mergedCleanRef.current = mergedClean;
          savedCleanRef.current = remoteClean;
          setCharacter((prev) => {
            if (!prev || prev.id !== remote.id) return prev;
            const kept = Object.fromEntries(Object.keys(dirty).map((key) => [key, cleaned[key]]));
            return { ...prev, ...remote, ...kept, updatedAt: remote.updatedAt };
          });
          return {
            dirty: pickDirtyCharacterFields(mergedClean, remoteClean) as Partial<Character>,
            updatedAt: remote.updatedAt,
          };
        },
      });
      const nextClean = mergedCleanRef.current ?? cleaned;
      savedCleanRef.current = result.updatedAt
        ? { ...nextClean, updatedAt: result.updatedAt }
        : nextClean;
      if (result.updatedAt) {
        setCharacter((prev) => (prev ? { ...prev, updatedAt: result.updatedAt } : prev));
      }
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
    traitsDb: catalog.traitsDb,
    featsDb: catalog.featsDb,
    powerPartsDb: catalog.powerPartsDb,
    techniquePartsDb: catalog.techniquePartsDb,
    itemPropertiesDb: catalog.itemPropertiesDb,
    codexSkills: catalog.codexSkills,
    codexArchetypes: catalog.codexArchetypes,
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
