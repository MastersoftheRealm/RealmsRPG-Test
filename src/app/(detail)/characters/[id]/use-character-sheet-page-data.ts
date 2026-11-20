/**
 * Character sheet page data layer (TASK-666d follow-up)
 * =====================================================
 * Load via `useCharacter` (TASK-750), realtime merge, path proficiency apply,
 * autosave, enrichment hooks, and derived stats. UI chrome lives in
 * `use-character-sheet-page-ui`.
 */

'use client';

import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
  type SetStateAction,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getCharacter, saveCharacterWithConflictRetry } from '@/services/character-service';
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
import {
  useAdvanceCharacterAutosaveBaseline,
  useRegisterCharacterAutosaveBaseline,
} from '@/lib/character/character-autosave-baseline-context';
import {
  coerceInventoryPatchCreatedRows,
  mergeInventoryCreatedRows,
  mirrorInventoryRowIdsOntoSheetEquipment,
  normalizeEquipmentForInventoryRelational,
  prepareInventoryPatchForAutosave,
} from '@/lib/character/inventory-patch';
import { cleanForSave } from '@/lib/data-enrichment';
import { getErrorMessage } from '@/lib/api-client';
import {
  CHARACTER_NAME_TOO_LONG_MESSAGE,
  characterSaveWithoutOverlongName,
} from '@/lib/character/character-name-limit';
import {
  applySheetAutosaveConflictFields,
  characterHasAutosaveDirtyEdits,
  characterLockToken,
  formatInventoryConflictOverwriteToast,
  listAutosaveConflictRemoteOverwrites,
  mergeRemotePreservingDirty,
  mergeSheetAutosaveBaseline,
  pickDirtyCharacterFields,
  withDirtyClears,
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
import { isGuestCharacterId } from '@/lib/guest-character-storage';
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
  const isGuestSheet = isGuestCharacterId(id);
  const loading = (isGuestSheet ? false : authLoading) || characterPending;
  const [actionError, setError] = useState<string | null>(null);
  const loadError = characterQueryError
    ? 'Failed to load character'
    : !loading && characterResult && !characterResult.character
      ? 'Character not found'
      : null;
  const error = actionError ?? loadError;

  const savedCleanRef = useRef<Record<string, unknown> | null>(null);
  const conflictOverwriteFieldsRef = useRef<string[]>([]);
  const realtimeRefetchGenerationRef = useRef(0);
  const rulesRef = useRef(rules);
  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  useRegisterCharacterAutosaveBaseline(id, savedCleanRef);
  const advanceSheetAutosaveBaseline = useAdvanceCharacterAutosaveBaseline();

  const sheetDirtyAgainstSavedBaseline = useCallback((doc: Character | null | undefined) => {
    if (!doc || !savedCleanRef.current) return false;
    const cleaned = cleanForSave(doc, rulesRef.current) as Record<string, unknown>;
    return characterHasAutosaveDirtyEdits(cleaned, savedCleanRef.current);
  }, []);

  const setCharacter = useCallback(
    (update: SetStateAction<Character | null>) => {
      patchCharacterDetailQuery(queryClient, viewerKey, id, update);
    },
    [queryClient, viewerKey, id],
  );

  useLayoutEffect(() => {
    if (!character || character.id !== id) {
      savedCleanRef.current = null;
      return;
    }
    rememberCharacterLockToken(id, character.updatedAt);
    if (!savedCleanRef.current) {
      savedCleanRef.current = cleanForSave(character, rules) as Record<string, unknown>;
    }
  }, [character, id, rules]);

  const isAutosaveDocumentClean = useCallback(
    (doc: Character | null | undefined) => !sheetDirtyAgainstSavedBaseline(doc),
    [sheetDirtyAgainstSavedBaseline],
  );

  const { data: userPowers = [] } = useUserPowers({ enabled: loadCatalog });
  const { data: userTechniques = [] } = useUserTechniques({ enabled: loadCatalog });
  const { data: userEmpoweredTechniques = [] } = useUserEmpoweredTechniques({
    enabled: loadCatalog,
  });
  const { data: userItems = [] } = useUserItems({ enabled: loadCatalog });
  const { data: traitsFromHook = [], isPending: traitsCatalogPending } = useTraits({
    enabled: loadCatalog,
  });
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
        traitsDb: traitsFromHook,
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
    sheetEditNotification,
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
    if (!character?.id || isGuestCharacterId(character.id)) return;
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
          new: {
            id: string;
            current_health?: number | null | undefined;
            current_energy?: number | null | undefined;
            action_points?: number | null | undefined;
            updated_at?: string | null | undefined;
          };
        }) => {
          const charId = payload.new.id;
          rememberCharacterLockToken(charId, payload.new.updated_at);
          const suppressResources = shouldSuppressRemoteResourceMerge(charId);
          const scalarResources: Record<string, unknown> = {
            ...(typeof payload.new.current_health === 'number' && {
              currentHealth: payload.new.current_health,
            }),
            ...(typeof payload.new.current_energy === 'number' && {
              currentEnergy: payload.new.current_energy,
            }),
            ...(typeof payload.new.action_points === 'number' && {
              actionPoints: payload.new.action_points,
            }),
          };
          setCharacter((prev) => {
            if (!prev || prev.id !== charId) return prev;
            const { character: next, nextBaseline } = mergeSheetRealtimePayload(
              prev,
              scalarResources,
              savedCleanRef.current,
              {
                suppressResources,
                updatedAt: payload.new.updated_at,
              },
            );
            if (nextBaseline && !sheetDirtyAgainstSavedBaseline(prev)) {
              savedCleanRef.current = nextBaseline;
            }
            return next;
          });

          // Child-table writes surface as a parent timestamp update. Fetch the
          // assembled relational document, then preserve any locally dirty keys.
          const refetchGeneration = ++realtimeRefetchGenerationRef.current;
          void getCharacter(charId)
            .then((result) => {
              if (refetchGeneration !== realtimeRefetchGenerationRef.current) return;
              const remote = result.character;
              if (!remote) return;
              setCharacter((prev) => {
                if (!prev || prev.id !== charId) return prev;
                const { character: next, nextBaseline } = mergeSheetRealtimePayload(
                  prev,
                  remote as unknown as Record<string, unknown>,
                  savedCleanRef.current,
                  { suppressResources, updatedAt: remote.updatedAt },
                );
                if (nextBaseline && !sheetDirtyAgainstSavedBaseline(prev)) {
                  savedCleanRef.current = nextBaseline;
                }
                return next;
              });
            })
            .catch((error: unknown) => {
              console.warn('[character realtime] relational refetch failed', error);
            });
        },
      )
      .subscribe();
    return () => {
      realtimeRefetchGenerationRef.current += 1;
      supabase.removeChannel(channel);
    };
  }, [character?.id, setCharacter, sheetDirtyAgainstSavedBaseline]);

  const isOwner = Boolean(character && (isGuestSheet || (user && character.userId === user.uid)));

  useCharacterResourceSync(character, isOwner && !isGuestSheet);

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

  const { hasUnsavedChanges, saveNow, syncBlockedByNetwork } = useAutoSave({
    data: character,
    areEqual: (a) => isAutosaveDocumentClean(a),
    onSave: async (data) => {
      if (!data) return;
      const rawCleaned = cleanForSave(data, rules) as Record<string, unknown>;
      prepareInventoryPatchForAutosave(savedCleanRef.current, rawCleaned);
      const mirroredEquipment = mirrorInventoryRowIdsOntoSheetEquipment(
        data.equipment,
        rawCleaned.equipment,
      );
      if (mirroredEquipment !== data.equipment) {
        setCharacter((prev) =>
          prev ? { ...prev, equipment: mirroredEquipment as Character['equipment'] } : prev,
        );
      }
      const prepared = characterSaveWithoutOverlongName(rawCleaned, savedCleanRef.current);
      if (prepared.rejected) {
        showToast(CHARACTER_NAME_TOO_LONG_MESSAGE, 'error');
        if (typeof prepared.cleaned.name === 'string') {
          const revertName = prepared.cleaned.name;
          setCharacter((prev) =>
            prev && prev.name !== revertName ? { ...prev, name: revertName } : prev,
          );
        }
      }
      const cleaned = prepared.cleaned;
      const dirty = prepared.dirty;
      if (Object.keys(dirty).length === 0) {
        return;
      }
      const inventoryBaselineAtSave = savedCleanRef.current
        ? (structuredClone(savedCleanRef.current) as Record<string, unknown>)
        : null;
      const mergedCleanRef: { current: Record<string, unknown> | null } = { current: null };
      const result = await saveCharacterWithConflictRetry(id, dirty as Partial<Character>, {
        updatedAt: characterLockToken(data.updatedAt),
        inventorySaveBaseline: inventoryBaselineAtSave,
        mergeOnConflict: (remote) => {
          const remoteClean = cleanForSave(remote, rules) as Record<string, unknown>;
          const localClean = withDirtyClears(cleaned, dirty);
          conflictOverwriteFieldsRef.current = listAutosaveConflictRemoteOverwrites(
            inventoryBaselineAtSave,
            localClean,
            remoteClean,
            Object.keys(dirty),
          );
          const mergedClean = mergeRemotePreservingDirty(
            remoteClean,
            localClean,
            Object.keys(dirty),
            inventoryBaselineAtSave,
          );
          mergedCleanRef.current = mergedClean;
          savedCleanRef.current = mergeSheetAutosaveBaseline(
            remoteClean,
            savedCleanRef.current ?? {},
            Object.keys(dirty),
            cleaned,
          );
          setCharacter((prev) => {
            if (!prev || prev.id !== remote.id) return prev;
            return applySheetAutosaveConflictFields(
              prev as unknown as Record<string, unknown>,
              remote as unknown as Record<string, unknown>,
              mergedClean,
              dirty,
            ) as Character;
          });
          return {
            dirty: pickDirtyCharacterFields(mergedClean, remoteClean) as Partial<Character>,
            updatedAt: remote.updatedAt,
            inventorySaveBaseline: remoteClean,
          };
        },
      });
      const baselineResult = {
        applied: result.applied as Record<string, unknown>,
        updatedAt: result.updatedAt,
        ...(result.inventoryPatchResult
          ? { inventoryPatchResult: result.inventoryPatchResult }
          : {}),
      };
      advanceSheetAutosaveBaseline(id, baselineResult);
      const createdRows = coerceInventoryPatchCreatedRows(
        result.inventoryPatchResult?.createdRows ?? [],
      );
      if (createdRows.length > 0) {
        setCharacter((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            equipment: mergeInventoryCreatedRows(
              prev.equipment,
              createdRows,
            ) as Character['equipment'],
          };
        });
      }
      if (result.updatedAt) {
        setCharacter((prev) => (prev ? { ...prev, updatedAt: result.updatedAt } : prev));
      }
      setCharacter((prev) => {
        if (!prev?.equipment) return prev;
        const equipment = normalizeEquipmentForInventoryRelational(
          prev.equipment,
        ) as Character['equipment'];
        return equipment === prev.equipment ? prev : { ...prev, equipment };
      });
      if (result.conflictRetried) {
        if (conflictOverwriteFieldsRef.current.length > 0) {
          showToast(formatInventoryConflictOverwriteToast(conflictOverwriteFieldsRef.current), 'info');
        }
        conflictOverwriteFieldsRef.current = [];
        try {
          const fresh = await getCharacter(id);
          const remoteCharacter = fresh.character;
          if (remoteCharacter) {
            setCharacter((prev) => {
              if (!prev) return prev;
              const { character: next, nextBaseline } = mergeSheetRealtimePayload(
                prev,
                remoteCharacter as unknown as Record<string, unknown>,
                savedCleanRef.current,
                { updatedAt: remoteCharacter.updatedAt },
              );
              if (nextBaseline && !sheetDirtyAgainstSavedBaseline(prev)) {
                savedCleanRef.current = nextBaseline;
              }
              return next;
            });
          }
        } catch {
          // Conflict merge already updated the sheet; refetch is best-effort sync.
        }
      }
    },
    delay: 2000,
    enabled: isOwner,
    onSaveError: (error) => {
      const message = getErrorMessage(error, 'Failed to save character');
      showToast(
        message.includes(CHARACTER_NAME_TOO_LONG_MESSAGE)
          ? CHARACTER_NAME_TOO_LONG_MESSAGE
          : 'Failed to save character',
        'error',
      );
    },
  });

  return {
    id,
    user,
    showToast,
    rules,
    character,
    setCharacter,
    loading,
    error,
    setError,
    isOwner,
    isGuestSheet,
    isInCampaign,
    campaignContext,
    hasUnsavedChanges,
    saveNow,
    syncBlockedByNetwork,
    traitsDb: catalog.traitsDb,
    traitsCatalogLoading: loadCatalog && catalog.traitsDb.length === 0 && traitsCatalogPending,
    featsDb: catalog.featsDb,
    powerPartsDb: catalog.powerPartsDb,
    techniquePartsDb: catalog.techniquePartsDb,
    itemPropertiesDb: catalog.itemPropertiesDb,
    codexSkills: catalog.codexSkills,
    codexArchetypes: catalog.codexArchetypes,
    allSpecies,
    enrichedData,
    characterSpeciesTraits,
    characterSpeciesSkills,
    characterForDisplay,
    calculatedStats,
    pointBudgets,
    archetypeProgression,
    sheetEditNotification,
    skills,
    stateFeatsList,
    stateUsesMax,
    stateUsesCurrent,
    archetypeFeatsForDisplay,
    characterFeatsForDisplay,
  };
}
