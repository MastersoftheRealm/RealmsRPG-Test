/**
 * Campaign Character View Page
 * ============================
 * Read-only character sheet view for Realm Masters viewing their campaign players.
 * Reuses sheet derived assemble + CharacterSheetBody (TASK-597) — no parallel enrich/stats glue.
 */

'use client';

import { useState, useEffect, useMemo, useCallback, type Dispatch, type SetStateAction } from 'react';
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
  buildCharacterSheetLibraryProps,
  resolveLibraryActiveTab,
} from '@/components/character-sheet';
import type {
  AddModalType,
  FeatModalType,
  SkillModalType,
} from '@/components/character-sheet/character-sheet-context';
import type { CharacterSheetDerivedHandlers } from '@/components/character-sheet/use-character-sheet-derived';
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
import type {
  Character,
  CharacterLibraryTabId,
  CharacterTempModifiers,
  AbilityName,
  Item,
} from '@/types';
import type { LibraryForView } from '@/services/character-service';

const noop = () => {};
const noopAbility = (_ability: AbilityName, _value: number) => {};
const noopDefense = (_defense: string, _value: number) => {};
const noopTemp = (_patch: CharacterTempModifiers) => {};
const noopSkill = (
  _skillId: string,
  _updates: Partial<{ skill_val: number; prof: boolean; ability: string }>
) => {};
const noopProf = (_value: number) => {};
const noopMilestone = (_level: number, _choice: 'innate' | 'feat') => {};
const noopAddModal: (type: AddModalType) => void = noop;
const noopFeatModal: (type: FeatModalType) => void = noop;
const noopSkillModal: (type: SkillModalType) => void = noop;

/** Stable no-op library handlers — view is read-only (no mutations). */
const READONLY_LIBRARY_HANDLERS: Omit<CharacterSheetDerivedHandlers, 'setCharacter'> = {
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

  const setCharacterNoop = useCallback<Dispatch<SetStateAction<Character | null>>>(() => {
    /* read-only — ignore local mutations from sheet chrome */
  }, []);

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
      handlers: {
        setCharacter: setCharacterNoop,
        ...READONLY_LIBRARY_HANDLERS,
      },
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
    setCharacterNoop,
  ]);

  const sheetContextValue = useMemo(
    () =>
      character
        ? {
            character,
            setCharacter: setCharacterNoop,
            isEditMode: false,
            isOwner: false,
            setAddModalType: noopAddModal,
            setFeatModalType: noopFeatModal,
            setSkillModalType: noopSkillModal,
            skills,
            pointBudgets,
            enrichedData,
            librarySectionProps,
            characterSpeciesSkills,
            libraryActiveTab,
            setLibraryActiveTab,
            onAbilityChange: noopAbility,
            onDefenseChange: noopDefense,
            onTempModifiersChange: noopTemp,
            onSkillChange: noopSkill,
            onRemoveSkill: noop,
            onAddSubSkill: noop,
            onMartialProfChange: noopProf,
            onPowerProfChange: noopProf,
            onMilestoneChoiceChange: noopMilestone,
            onEditArchetype: noop,
            onEditSpecies: noop,
          }
        : null,
    [
      character,
      setCharacterNoop,
      skills,
      pointBudgets,
      enrichedData,
      librarySectionProps,
      characterSpeciesSkills,
      libraryActiveTab,
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
