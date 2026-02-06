/**
 * Campaign Character View Page
 * ============================
 * Read-only character sheet view for Realm Masters viewing their campaign players.
 */

'use client';

import { useState, useEffect } from 'react';
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
  useRTDBFeats,
  useRTDBSkills,
} from '@/hooks';
import { calculateArchetypeProgression, calculateSkillPoints } from '@/lib/game/formulas';
import type { Character, Item } from '@/types';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use current user's library for enrichment (viewed character may reference codex items)
  const { data: userPowers = [] } = useUserPowers();
  const { data: userTechniques = [] } = useUserTechniques();
  const { data: userItems = [] } = useUserItems();
  const { data: traitsDb = [] } = useTraits();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  const { data: rtdbEquipment = [] } = useEquipment();
  const { data: allSpecies = [] } = useSpecies();
  const { data: rtdbSkills = [] } = useRTDBSkills();
  const { data: featsDb = [] } = useRTDBFeats();

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
        setCharacter({ id: data.id, ...data });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load character');
      } finally {
        setLoading(false);
      }
    }
    fetchCharacter();
  }, [campaignId, userId, characterId]);

  const calculatedStats = character ? calculateStats(character) : null;
  const enrichedData = character
    ? enrichCharacterData(character, userPowers, userTechniques, userItems, rtdbEquipment, powerPartsDb, techniquePartsDb)
    : null;

  const characterSpeciesSkills = character && allSpecies.length
    ? (() => {
        const speciesName = character.ancestry?.name || character.species;
        const species = allSpecies.find((s) => s.name?.toLowerCase() === speciesName?.toLowerCase());
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
        const rtdbSkill = rtdbSkills.find(
          (rs) => rs.id === skill.id || rs.name?.toLowerCase() === skill.name?.toLowerCase()
        );
        const availableAbilities = rtdbSkill?.ability
          ? rtdbSkill.ability.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean)
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
                defenseSkills={character.defenseSkills}
                level={character.level || 1}
                archetypeAbility={character.archetype?.ability as keyof typeof character.abilities}
                martialAbility={character.mart_abil}
                powerAbility={character.pow_abil}
                isEditMode={false}
              />
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_2fr] gap-4 items-stretch mt-4">
                <SkillsSection
                  skills={skills}
                  abilities={character.abilities}
                  isEditMode={false}
                  totalSkillPoints={calculateSkillPoints(character.level || 1) - characterSpeciesSkills.length}
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
                  className="flex-1"
                />
                <LibrarySection
                  className="flex-1"
                  powers={enrichedData?.powers || character.powers || []}
                  techniques={enrichedData?.techniques || character.techniques || []}
                  weapons={enrichedData?.weapons || (character.equipment?.weapons || []) as Item[]}
                  armor={enrichedData?.armor || (character.equipment?.armor || []) as Item[]}
                  equipment={enrichedData?.equipment || (character.equipment?.items || []) as Item[]}
                  currency={character.currency}
                  innateEnergy={archetypeProgression?.innateEnergy || 0}
                  innateThreshold={archetypeProgression?.innateThreshold || 0}
                  innatePools={archetypeProgression?.innatePools || 0}
                  currentEnergy={character.energy?.current ?? calculatedStats.maxEnergy}
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
                  speciesTraitsFromRTDB={[]}
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
