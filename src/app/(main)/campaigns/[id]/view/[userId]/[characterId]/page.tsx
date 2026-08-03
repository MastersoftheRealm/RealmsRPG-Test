/**
 * Campaign Character View Page
 * ============================
 * Read-only character sheet view for Realm Masters viewing their campaign players.
 * Reuses sheet derived assemble + CharacterSheetBody (TASK-597) — no parallel enrich/stats glue.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { ProtectedRoute } from '@/components/layout';
import { LoadingState, Alert, PageContainer } from '@/components/ui';
import {
  SheetHeader,
  CharacterSheetProvider,
  CharacterSheetBody,
  useCharacterSheetDerived,
  resolveLibraryActiveTab,
} from '@/components/character-sheet';
import {
  buildReadOnlyLibraryHandlers,
  buildReadOnlySheetContextValue,
} from '@/components/character-sheet/read-only-sheet';
import type { SheetLibraryModel } from '@/components/character-sheet/library-section-props';
import { RollLog, RollProvider } from '@/components/rolls';
import {
  useUserPowers,
  useUserTechniques,
  useUserEmpoweredTechniques,
  useUserItems,
  useTraits,
  usePowerParts,
  useTechniqueParts,
  useItemProperties,
  useEquipment,
  useMergedSpecies,
  useCodexFeats,
  useCodexSkills,
  useCodexArchetypes,
  useOfficialLibrary,
} from '@/hooks';
import { useGameRules } from '@/hooks/use-game-rules';
import type { Character, CharacterLibraryTabId, Item } from '@/types';
import type { LibraryForView } from '@/services/character-service';

const READONLY_LIBRARY_HANDLERS = buildReadOnlyLibraryHandlers();

export default function CampaignCharacterViewPage() {
  return (
    <ProtectedRoute>
      <CampaignCharacterViewContent />
    </ProtectedRoute>
  );
}

function CampaignCharacterViewContent() {
  const { rules } = useGameRules();
  const params = useParams();
  const campaignId = params.id as string;
  const userId = params.userId as string;
  const characterId = params.characterId as string;

  const [character, setCharacter] = useState<Character | null>(null);
  const [libraryForView, setLibraryForView] = useState<LibraryForView | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [libraryActiveTab, setLibraryActiveTab] = useState<CharacterLibraryTabId>('feats');

  // Owner's library for enrichment when viewing another user's character; fallback for codex-only refs
  const { data: userPowers = [] } = useUserPowers();
  const { data: userTechniques = [] } = useUserTechniques();
  const { data: userEmpoweredTechniques = [] } = useUserEmpoweredTechniques();
  const { data: userItems = [] } = useUserItems();
  const { data: traitsDb = [] } = useTraits();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  const { data: codexEquipment = [] } = useEquipment();
  const { data: publicPowersRaw = [] } = useOfficialLibrary('powers');
  const { data: publicTechniquesRaw = [] } = useOfficialLibrary('techniques');
  const { data: publicItemsRaw = [] } = useOfficialLibrary('items');
  const publicLibraries = useMemo(
    () => ({
      powers: publicPowersRaw,
      techniques: publicTechniquesRaw,
      items: publicItemsRaw,
    }),
    [publicPowersRaw, publicTechniquesRaw, publicItemsRaw]
  );
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: featsDb = [] } = useCodexFeats();
  const { data: codexArchetypes = [] } = useCodexArchetypes();

  useEffect(() => {
    async function fetchCharacter() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch<
          Character & {
            libraryForView?: LibraryForView;
          }
        >(`/api/campaigns/${campaignId}/characters/${userId}/${characterId}`);
        const { libraryForView: lib, ...charData } = data;
        setCharacter(charData);
        setLibraryForView(lib);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load character');
      } finally {
        setLoading(false);
      }
    }
    fetchCharacter();
  }, [campaignId, userId, characterId]);

  const {
    enrichedData,
    characterSpeciesTraits,
    characterSpeciesSkills,
    characterForDisplay,
    calculatedStats,
    pointBudgets,
    archetypeProgression,
    skills,
    archetypeFeatsForDisplay,
    characterFeatsForDisplay,
    stateFeatsList,
    stateUsesMax,
    stateUsesCurrent,
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

  // Clamp library tab to visible tabs (same as owner sheet).
  if (character) {
    const resolvedLibraryTab = resolveLibraryActiveTab(libraryActiveTab, {
      isEditMode: false,
      tabVisibility: character.libraryTabVisibility,
    });
    if (resolvedLibraryTab !== libraryActiveTab) {
      setLibraryActiveTab(resolvedLibraryTab);
    }
  }

  const libraryModel = useMemo((): SheetLibraryModel | null => {
    if (!character || !calculatedStats) return null;
    return {
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
    };
  }, [
    character,
    calculatedStats,
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
  ]);

  const sheetContextValue = useMemo(
    () =>
      character
        ? buildReadOnlySheetContextValue({
            character,
            skills,
            pointBudgets,
            enrichedData,
            libraryModel,
            libraryHandlers: READONLY_LIBRARY_HANDLERS,
            characterSpeciesSkills,
            libraryActiveTab,
            setLibraryActiveTab,
            displayCharacter: character,
            calculatedStats,
          })
        : null,
    [
      character,
      skills,
      pointBudgets,
      enrichedData,
      libraryModel,
      characterSpeciesSkills,
      libraryActiveTab,
      calculatedStats,
    ]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading character sheet..." size="lg" />
      </div>
    );
  }

  if (error || !character || !sheetContextValue) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Alert variant="danger" title="Cannot view character">
            {error || 'Character not found. It may be set to private.'}
          </Alert>
          <Link
            href={`/campaigns/${campaignId}`}
            className="mt-4 inline-flex items-center gap-1 text-primary-link-fg hover:underline"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Campaign
          </Link>
        </div>
      </div>
    );
  }

  return (
    <RollProvider
      campaignContext={{
        campaignId,
        characterId,
        characterName: character.name,
      }}
    >
      <CharacterSheetProvider value={sheetContextValue}>
        <div className="min-h-screen bg-background pb-8">
          <PageContainer size="tool" padded={false} className="pt-4">
            <Link
              href={`/campaigns/${campaignId}`}
              className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-fg-hover mb-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Campaign
            </Link>
            <p className="text-sm text-text-muted dark:text-text-secondary mb-4">
              View-only (Realm Master view)
            </p>

            {calculatedStats && (
              <>
                <SheetHeader
                  character={characterForDisplay ?? character}
                  calculatedStats={calculatedStats}
                  isEditMode={false}
                  speedDisplayUnit={character.speedDisplayUnit ?? 'spaces'}
                  enrichedArmor={enrichedData?.armor as Item[] | undefined}
                  innateThreshold={archetypeProgression?.innateThreshold || 0}
                  innatePools={archetypeProgression?.innatePools || 0}
                />
                <CharacterSheetBody />
              </>
            )}
          </PageContainer>
          <RollLog />
        </div>
      </CharacterSheetProvider>
    </RollProvider>
  );
}
