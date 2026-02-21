/**
 * Campaign Character View Page
 * ============================
 * Read-only character sheet view for Realm Masters viewing their campaign players.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { ProtectedRoute } from '@/components/layout';
import { LoadingState, Alert } from '@/components/ui';
import { SheetHeader, AbilitiesSection, SkillsSection, ArchetypeSection, LibrarySection, RollLog } from '@/components/character-sheet';
import { RollProvider } from '@/components/character-sheet/roll-context';
import { calculateStats } from '@/app/(main)/characters/[id]/character-sheet-utils';
import { enrichCharacterData } from '@/lib/data-enrichment';
import {
  useUserPowers,
  useUserTechniques,
  useUserItems,
  useTraits,
  usePowerParts,
  useTechniqueParts,
  useItemProperties,
  useEquipment,
  useSpecies,
  useCodexFeats,
  useCodexSkills,
  usePublicLibrary,
  type Species,
  type Skill,
} from '@/hooks';
import { calculateArchetypeProgression, calculateSkillPointsForEntity } from '@/lib/game/formulas';
import type { Character, Item } from '@/types';
import type { UserPower, UserTechnique, UserItem } from '@/hooks/use-user-library';
import { DEFAULT_DEFENSE_SKILLS } from '@/types/skills';

export default function CampaignCharacterViewPage() {
  return (
    <ProtectedRoute>
      <CampaignCharacterViewContent />
    </ProtectedRoute>
  );
}

function CampaignCharacterViewContent() {
  const params = useParams();
  const campaignId = params.id as string;
  const userId = params.userId as string;
  const characterId = params.characterId as string;

  const [character, setCharacter] = useState<Character | null>(null);
  const [libraryForView, setLibraryForView] = useState<{ powers: unknown[]; techniques: unknown[]; items: unknown[] } | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Owner's library for enrichment when viewing another user's character; fallback to current user's for codex-only refs
  const { data: userPowers = [] } = useUserPowers();
  const { data: userTechniques = [] } = useUserTechniques();
  const { data: userItems = [] } = useUserItems();
  const { data: traitsDb = [] } = useTraits();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  const { data: codexEquipment = [] } = useEquipment();
  const { data: publicPowersRaw = [] } = usePublicLibrary('powers');
  const { data: publicTechniquesRaw = [] } = usePublicLibrary('techniques');
  const { data: publicItemsRaw = [] } = usePublicLibrary('items');
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
    const techniques = (publicTechniquesRaw as Record<string, unknown>[]).map((t) => ({
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
    return { powers, techniques, items } as { powers: UserPower[]; techniques: UserTechnique[]; items: UserItem[] };
  }, [publicPowersRaw, publicTechniquesRaw, publicItemsRaw]);
  const { data: allSpecies = [] } = useSpecies();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: featsDb = [] } = useCodexFeats();

  useEffect(() => {
    async function fetchCharacter() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/campaigns/${campaignId}/characters/${userId}/${characterId}`
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to load (${res.status})`);
        }
        const data = await res.json();
        const { libraryForView: lib, ...charData } = data;
        setCharacter({ id: charData.id, ...charData });
        setLibraryForView(lib);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load character');
      } finally {
        setLoading(false);
      }
    }
    fetchCharacter();
  }, [campaignId, userId, characterId]);

  const calculatedStats = character ? calculateStats(character) : null;
  const powersForEnrich = (libraryForView?.powers as typeof userPowers) ?? userPowers;
  const techniquesForEnrich = (libraryForView?.techniques as typeof userTechniques) ?? userTechniques;
  const itemsForEnrich = (libraryForView?.items as typeof userItems) ?? userItems;
  const enrichedData = character
    ? enrichCharacterData(character, powersForEnrich, techniquesForEnrich, itemsForEnrich, codexEquipment, powerPartsDb, techniquePartsDb, publicLibraries)
    : null;

  const characterSpeciesSkills = character && allSpecies.length
    ? (() => {
        const speciesName = character.ancestry?.name || character.species;
        const species = allSpecies.find((s: Species) => s.name?.toLowerCase() === speciesName?.toLowerCase());
        return (species?.skills || []) as string[];
      })()
    : [];

  const archetypeProgression = character
    ? calculateArchetypeProgression(
        character.level || 1,
        character.mart_prof || 0,
        character.pow_prof || 0,
        character.archetypeChoices || {}
      )
    : null;

  const skills = character
    ? ((character.skills || []) as Array<{
        id: string;
        name: string;
        category?: string;
        skill_val: number;
        prof?: boolean;
        baseSkill?: string;
        ability?: string;
        availableAbilities?: string[];
      }>).map((skill) => {
        const codexSkill = codexSkills.find(
          (rs: Skill) => rs.id === skill.id || rs.name?.toLowerCase() === skill.name?.toLowerCase()
        );
        const availableAbilities = codexSkill?.ability
          ? codexSkill.ability.split(',').map((a: string) => a.trim().toLowerCase()).filter(Boolean)
          : [];
        return {
          ...skill,
          ability: skill.ability || availableAbilities[0] || 'strength',
          availableAbilities: availableAbilities.length ? availableAbilities : skill.availableAbilities,
        };
      })
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading character sheet..." size="lg" />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Alert variant="danger" title="Cannot view character">
            {error || 'Character not found. It may be set to private.'}
          </Alert>
          <Link
            href={`/campaigns/${campaignId}`}
            className="mt-4 inline-flex items-center gap-1 text-primary-600 hover:underline"
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
      <div className="min-h-screen bg-background pb-8">
        <div className="max-w-[1600px] mx-auto px-4 pt-4">
          <Link
            href={`/campaigns/${campaignId}`}
            className="inline-flex items-center gap-1 text-text-secondary hover:text-primary-600 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Campaign
          </Link>
          <p className="text-sm text-text-muted mb-4">View-only — Realm Master view</p>

          {calculatedStats && (
            <>
              <SheetHeader
                character={character}
                calculatedStats={calculatedStats}
                isEditMode={false}
              />
              <AbilitiesSection
                abilities={character.abilities}
                defenseSkills={character.defenseVals || character.defenseSkills}
                level={character.level || 1}
                archetypeAbility={(character.pow_abil || character.archetype?.ability) as keyof typeof character.abilities}
                martialAbility={character.mart_abil}
                powerAbility={character.pow_abil}
                isEditMode={false}
              />
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_2fr] gap-4 items-stretch mt-4">
                <SkillsSection
                  skills={skills}
                  abilities={character.abilities}
                  isEditMode={false}
                  totalSkillPoints={calculateSkillPointsForEntity(character.level || 1, 'character')}
                  speciesSkills={characterSpeciesSkills}
                  onSkillChange={() => {}}
                  onRemoveSkill={() => {}}
                  onAddSkill={() => {}}
                  onAddSubSkill={() => {}}
                  className="flex-1"
                />
                <ArchetypeSection
                  character={character}
                  isEditMode={false}
                  enrichedWeapons={enrichedData?.weapons}
                  enrichedArmor={enrichedData?.armor}
                  className="flex-1"
                />
                <LibrarySection
                  className="flex-1"
                  powers={enrichedData?.powers || character.powers || []}
                  techniques={enrichedData?.techniques || character.techniques || []}
                  weapons={(enrichedData?.weapons || (character.equipment?.weapons || [])) as Item[]}
                  armor={(enrichedData?.armor || (character.equipment?.armor || [])) as Item[]}
                  equipment={(enrichedData?.equipment || (character.equipment?.items || [])) as Item[]}
                  currency={character.currency}
                  innateEnergy={archetypeProgression?.innateEnergy || 0}
                  innateThreshold={archetypeProgression?.innateThreshold || 0}
                  innatePools={archetypeProgression?.innatePools || 0}
                  currentEnergy={character.currentEnergy ?? character.energy?.current ?? calculatedStats.maxEnergy}
                  martialProficiency={character.mart_prof ?? 0}
                  isEditMode={false}
                  onAddPower={() => {}}
                  onRemovePower={() => {}}
                  onTogglePowerInnate={() => {}}
                  onUsePower={() => {}}
                  onAddTechnique={() => {}}
                  onRemoveTechnique={() => {}}
                  onUseTechnique={() => {}}
                  onAddWeapon={() => {}}
                  onRemoveWeapon={() => {}}
                  onToggleEquipWeapon={() => {}}
                  onAddArmor={() => {}}
                  onRemoveArmor={() => {}}
                  onToggleEquipArmor={() => {}}
                  onAddEquipment={() => {}}
                  onRemoveEquipment={() => {}}
                  onEquipmentQuantityChange={() => {}}
                  onCurrencyChange={() => {}}
                  powerPartsDb={powerPartsDb}
                  techniquePartsDb={techniquePartsDb}
                  itemPropertiesDb={itemPropertiesDb}
                  level={character.level}
                  archetypeFeats={character.archetypeFeats}
                  characterFeats={character.feats}
                  onFeatUsesChange={() => {}}
                  onAddArchetypeFeat={() => {}}
                  onAddCharacterFeat={() => {}}
                  onRemoveFeat={() => {}}
                  traitsDb={traitsDb}
                  featsDb={featsDb}
                  traitUses={character.traitUses}
                  onTraitUsesChange={() => {}}
                  ancestry={character.ancestry as never}
                  vanillaTraits={{
                    ancestryTraits: character.ancestryTraits,
                    flawTrait: character.flawTrait,
                    characteristicTrait: character.characteristicTrait,
                    speciesTraits: character.speciesTraits,
                  }}
                  speciesTraitsFromCodex={[]}
  archetypeAbility={character.abilities?.[character.pow_abil as keyof typeof character.abilities] || 0}
  unarmedProwess={character.unarmedProwess ?? 0}
  onUnarmedProwessChange={() => {}}
  weight={character.weight}
  height={character.height}
  appearance={character.appearance}
  archetypeDesc={character.archetypeDesc}
  notes={character.notes}
  abilities={character.abilities}
  namedNotes={character.namedNotes}
                />
              </div>
            </>
          )}
        </div>
        <RollLog />
      </div>
    </RollProvider>
  );
}
