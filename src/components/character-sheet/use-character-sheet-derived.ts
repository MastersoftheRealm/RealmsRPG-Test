/**
 * Character Sheet — derived data (memos extracted from page.tsx for TASK-348).
 */

'use client';

import { useMemo } from 'react';
import type { Archetype, Character, CharacterFeat, Feat, Skill } from '@/types';
import type { Species, Trait } from '@/hooks/codex-types';
import { DEFAULT_DEFENSE_SKILLS } from '@/types/skills';
import { enrichCharacterData } from '@/lib/data-enrichment';
import {
  calculateAbilityPoints,
  calculateAbilityScoreCost,
  calculateArchetypeProgression,
  calculateMaxArchetypeFeats,
  calculateMaxCharacterFeats,
  calculateProficiency,
  calculateSkillPointsForEntity,
  resolveParentSkillNameForSubSkill,
  type CodexSkillParentRef,
} from '@/lib/game/formulas';
import { getArchetypeCodexLookupId, mergeArchetypeFromCodex } from '@/lib/game/archetype-display';
import { DEFENSE_INCREASE_COST } from '@/lib/game/skill-allocation';
import { applySpeciesTraitChoiceSelections } from '@/lib/choice-trait';
import type { CoreRulesMap } from '@/types/core-rules';
import type { LibraryForView } from '@/services/character-service';
import type { UserItem, UserPower, UserTechnique } from '@/hooks/use-user-library';
import { calculateAllStats, type AllDerivedStats } from '@/lib/game/calculations';
import { buildLibrarySectionProps } from '@/app/(main)/characters/[id]/library-section-props';
import type { LibrarySectionProps } from './library-section';

export type CharacterSheetStats = AllDerivedStats;

function calculateStats(
  character: Character,
  rules?: Partial<CoreRulesMap>
): CharacterSheetStats {
  return calculateAllStats(character, rules);
}

export interface CharacterSheetSkillRow {
  id: string;
  name: string;
  category?: string;
  skill_val: number;
  prof?: boolean;
  baseSkill?: string;
  selectedBaseSkillId?: string;
  ability?: string;
  availableAbilities?: string[];
}

export interface CharacterSheetPointBudgets {
  totalAbilityPoints: number;
  spentAbilityPoints: number;
  availableAbilityPoints: number;
  totalSkillPoints: number;
  spentSkillPoints: number;
  availableSkillPoints: number;
}

export interface CharacterSheetDerivedHandlers {
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  handleRemovePower: NonNullable<LibrarySectionProps['onRemovePower']>;
  handleTogglePowerInnate: NonNullable<LibrarySectionProps['onTogglePowerInnate']>;
  handleUsePower: NonNullable<LibrarySectionProps['onUsePower']>;
  handleRemoveTechnique: NonNullable<LibrarySectionProps['onRemoveTechnique']>;
  handleUseTechnique: NonNullable<LibrarySectionProps['onUseTechnique']>;
  handleRemoveWeapon: NonNullable<LibrarySectionProps['onRemoveWeapon']>;
  handleToggleEquipWeapon: NonNullable<LibrarySectionProps['onToggleEquipWeapon']>;
  handleRemoveShield: NonNullable<LibrarySectionProps['onRemoveShield']>;
  handleToggleEquipShield: NonNullable<LibrarySectionProps['onToggleEquipShield']>;
  handleRemoveArmor: NonNullable<LibrarySectionProps['onRemoveArmor']>;
  handleToggleEquipArmor: NonNullable<LibrarySectionProps['onToggleEquipArmor']>;
  handleRemoveEquipment: NonNullable<LibrarySectionProps['onRemoveEquipment']>;
  handleEquipmentQuantityChange: NonNullable<LibrarySectionProps['onEquipmentQuantityChange']>;
  handleCurrencyChange: NonNullable<LibrarySectionProps['onCurrencyChange']>;
  handleStateUsesChange: NonNullable<LibrarySectionProps['onStateUsesChange']>;
  handleEnterState: NonNullable<LibrarySectionProps['onEnterState']>;
  handleFeatUsesChange: NonNullable<LibrarySectionProps['onFeatUsesChange']>;
  handleRequestRemoveFeat: NonNullable<LibrarySectionProps['onRemoveFeat']>;
  handleTraitUsesChange: NonNullable<LibrarySectionProps['onTraitUsesChange']>;
}

export interface BuildLibrarySectionPropsInput {
  character: Character;
  enrichedData: ReturnType<typeof enrichCharacterData> | null;
  archetypeProgression: ReturnType<typeof calculateArchetypeProgression> | null;
  calculatedMaxEnergy: number;
  powerPartsDb: LibrarySectionProps['powerPartsDb'];
  techniquePartsDb: LibrarySectionProps['techniquePartsDb'];
  itemPropertiesDb: LibrarySectionProps['itemPropertiesDb'];
  traitsDb: Trait[];
  featsDb: NonNullable<LibrarySectionProps['featsDb']>;
  characterSpeciesTraits: string[];
  archetypeFeatsForDisplay: CharacterFeat[];
  characterFeatsForDisplay: CharacterFeat[];
  stateFeatsList: Array<CharacterFeat & { type: 'archetype' | 'character' }>;
  stateUsesCurrent: number;
  stateUsesMax: number;
  handlers: CharacterSheetDerivedHandlers;
}

export function buildCharacterSheetLibraryProps(input: BuildLibrarySectionPropsInput) {
  return buildLibrarySectionProps({
    character: input.character,
    enrichedData: input.enrichedData,
    archetypeProgression: input.archetypeProgression,
    calculatedMaxEnergy: input.calculatedMaxEnergy,
    powerPartsDb: input.powerPartsDb,
    techniquePartsDb: input.techniquePartsDb,
    itemPropertiesDb: input.itemPropertiesDb,
    traitsDb: input.traitsDb,
    featsDb: input.featsDb,
    characterSpeciesTraits: input.characterSpeciesTraits,
    archetypeFeatsForDisplay: input.archetypeFeatsForDisplay,
    characterFeatsForDisplay: input.characterFeatsForDisplay,
    stateFeatsList: input.stateFeatsList,
    stateUsesCurrent: input.stateUsesCurrent,
    stateUsesMax: input.stateUsesMax,
    setCharacter: input.handlers.setCharacter,
    handleRemovePower: input.handlers.handleRemovePower,
    handleTogglePowerInnate: input.handlers.handleTogglePowerInnate,
    handleUsePower: input.handlers.handleUsePower,
    handleRemoveTechnique: input.handlers.handleRemoveTechnique,
    handleUseTechnique: input.handlers.handleUseTechnique,
    handleRemoveWeapon: input.handlers.handleRemoveWeapon,
    handleToggleEquipWeapon: input.handlers.handleToggleEquipWeapon,
    handleRemoveShield: input.handlers.handleRemoveShield,
    handleToggleEquipShield: input.handlers.handleToggleEquipShield,
    handleRemoveArmor: input.handlers.handleRemoveArmor,
    handleToggleEquipArmor: input.handlers.handleToggleEquipArmor,
    handleRemoveEquipment: input.handlers.handleRemoveEquipment,
    handleEquipmentQuantityChange: input.handlers.handleEquipmentQuantityChange,
    handleCurrencyChange: input.handlers.handleCurrencyChange,
    handleStateUsesChange: input.handlers.handleStateUsesChange,
    handleEnterState: input.handlers.handleEnterState,
    handleFeatUsesChange: input.handlers.handleFeatUsesChange,
    handleRequestRemoveFeat: input.handlers.handleRequestRemoveFeat,
    handleTraitUsesChange: input.handlers.handleTraitUsesChange,
  });
}

export interface UseCharacterSheetDerivedArgs {
  character: Character | null;
  libraryForView: LibraryForView | undefined;
  userPowers: UserPower[];
  userTechniques: UserTechnique[];
  userEmpoweredTechniques: UserTechnique[];
  userItems: UserItem[];
  codexEquipment: unknown[];
  powerPartsDb: LibrarySectionProps['powerPartsDb'];
  techniquePartsDb: LibrarySectionProps['techniquePartsDb'];
  itemPropertiesDb: LibrarySectionProps['itemPropertiesDb'];
  publicLibraries: {
    powers: UserPower[];
    techniques: UserTechnique[];
    items: UserItem[];
  };
  allSpecies: Species[];
  traitsDb: Trait[];
  codexSkills: Skill[];
  codexArchetypes: Archetype[];
  featsDb: Feat[];
  rules: Partial<CoreRulesMap> | undefined;
}

export function useCharacterSheetDerived({
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
}: UseCharacterSheetDerivedArgs) {
  const enrichedData = useMemo(() => {
    if (!character) return null;
    const powers = libraryForView ? (libraryForView.powers as unknown as typeof userPowers) : userPowers;
    const baseTechniques = libraryForView
      ? (libraryForView.techniques as unknown as typeof userTechniques)
      : userTechniques;
    const techniques = libraryForView ? baseTechniques : [...baseTechniques, ...userEmpoweredTechniques];
    const items = libraryForView ? (libraryForView.items as unknown as typeof userItems) : userItems;
    return enrichCharacterData(
      character,
      powers,
      techniques,
      items,
      codexEquipment as Parameters<typeof enrichCharacterData>[4],
      powerPartsDb as Parameters<typeof enrichCharacterData>[5],
      techniquePartsDb as Parameters<typeof enrichCharacterData>[6],
      publicLibraries
    );
  }, [
    character,
    libraryForView,
    userPowers,
    userTechniques,
    userEmpoweredTechniques,
    userItems,
    codexEquipment,
    powerPartsDb,
    techniquePartsDb,
    publicLibraries,
  ]);

  const characterSpeciesTraits = useMemo(() => {
    if (!character || !allSpecies.length) return [];
    const ancestry = character.ancestry;

    if (ancestry?.mixed === true && Array.isArray(ancestry.selectedSpeciesTraits)) {
      const ids = ancestry.selectedSpeciesTraits
        .map((id) => (id != null ? String(id).trim() : ''))
        .filter((id) => id.length > 0);
      if (ids.length > 0) return ids;
    }

    const speciesId = ancestry?.id;
    const speciesName = ancestry?.name || character.species;
    let species = allSpecies.find((s: Species) => String(s.id) === String(speciesId));
    if (!species && speciesName) {
      species = allSpecies.find(
        (s: Species) => String(s.name ?? '').toLowerCase() === String(speciesName ?? '').toLowerCase()
      );
    }
    const raw = species?.species_traits || [];
    const choices = ancestry?.selectedSpeciesTraitChoices;
    return applySpeciesTraitChoiceSelections(raw, choices, traitsDb);
  }, [character, allSpecies, traitsDb]);

  const characterSpeciesSkills = useMemo(() => {
    if (!character || !allSpecies.length) return [] as string[];
    const ancestry = character.ancestry;

    if (ancestry?.mixed === true && ancestry?.speciesIds?.length === 2) {
      if (ancestry.selectedSpeciesSkillIds?.length === 2) {
        return ancestry.selectedSpeciesSkillIds;
      }
      const a = allSpecies.find((s: Species) => s.id === ancestry.speciesIds![0]);
      const b = allSpecies.find((s: Species) => s.id === ancestry.speciesIds![1]);
      const ids = new Set<string>();
      (a?.skills || []).forEach((id: string | number) => ids.add(String(id)));
      (b?.skills || []).forEach((id: string | number) => ids.add(String(id)));
      return Array.from(ids);
    }

    const speciesId = ancestry?.id;
    const speciesName = ancestry?.name || character.species;
    let species = allSpecies.find((s: Species) => String(s.id) === String(speciesId));
    if (!species && speciesName) {
      species = allSpecies.find(
        (s: Species) => String(s.name ?? '').toLowerCase() === String(speciesName ?? '').toLowerCase()
      );
    }
    return (species?.skills || []) as string[];
  }, [character, allSpecies]);

  const characterForDisplay = useMemo(() => {
    if (!character) return null;
    const lookupId = getArchetypeCodexLookupId(character);
    if (!lookupId) return character;
    const codex = codexArchetypes.find((a) => a.id === lookupId) as Archetype | undefined;
    if (!codex) return character;
    return mergeArchetypeFromCodex(character, codex);
  }, [character, codexArchetypes]);

  const calculatedStats = useMemo((): CharacterSheetStats | null => {
    if (!character) return null;
    return calculateStats(character, rules);
  }, [character, rules]);

  const pointBudgets = useMemo((): CharacterSheetPointBudgets | null => {
    if (!character) return null;

    const level = character.level || 1;
    const abilities = character.abilities || {};

    const totalAbilityPoints = calculateAbilityPoints(level, false, rules);

    const spentAbilityPoints = Object.values(abilities).reduce(
      (sum, value) => sum + calculateAbilityScoreCost(value || 0, rules),
      0
    );

    const rawTotalSkillPoints = 2 + level * 3;
    const speciesSkillCount = characterSpeciesSkills.filter((id) => id !== '0').length;
    const hasAnySpeciesSkill = characterSpeciesSkills.some((id) => id === '0');
    const totalSkillPoints = rawTotalSkillPoints - speciesSkillCount + (hasAnySpeciesSkill ? 1 : 0);

    const skillsList = (character.skills || []) as Array<{
      skill_val?: number;
      prof?: boolean;
      baseSkill?: string;
      baseSkillId?: number;
      selectedBaseSkillId?: string;
      name?: string;
      id?: string;
    }>;
    let spentSkillPoints = skillsList.reduce((sum, skill) => {
      let cost = skill.skill_val || 0;
      const isSubSkill =
        Boolean(skill.baseSkill) || skill.baseSkillId != null || skill.selectedBaseSkillId != null;
      if (skill.prof && !isSubSkill) {
        const isSpecies = characterSpeciesSkills.some(
          (ss) =>
            String(ss).toLowerCase() === String(skill.name || '').toLowerCase() ||
            String(ss) === String(skill.id || '')
        );
        if (!isSpecies) cost += 1;
      }
      return sum + cost;
    }, 0);

    const defVals = character.defenseVals || character.defenseSkills || DEFAULT_DEFENSE_SKILLS;
    const spentDefensePoints = Object.values(defVals).reduce(
      (sum: number, val) => sum + ((val as number) || 0) * DEFENSE_INCREASE_COST,
      0
    );
    spentSkillPoints += spentDefensePoints;

    return {
      totalAbilityPoints,
      spentAbilityPoints,
      availableAbilityPoints: totalAbilityPoints - spentAbilityPoints,
      totalSkillPoints,
      spentSkillPoints,
      availableSkillPoints: totalSkillPoints - spentSkillPoints,
    };
  }, [character, characterSpeciesSkills, rules]);

  const archetypeProgression = useMemo(() => {
    if (!character) return null;
    return calculateArchetypeProgression(
      character.level || 1,
      character.mart_prof || 0,
      character.pow_prof || 0,
      character.archetypeChoices || {}
    );
  }, [character]);

  const hasUnappliedPoints = useMemo(() => {
    if (!character) return false;

    const level = character.level || 1;
    const xp = character.experience ?? 0;
    const canLevelUp = xp >= level * 4;

    const totalAbilityPoints = calculateAbilityPoints(level, false, rules);
    const currentAbilities = character.abilities || {};
    const spentAbilityPoints = Object.values(currentAbilities).reduce(
      (sum, val) => sum + calculateAbilityScoreCost(val || 0, rules),
      0
    );
    const abilityPointsRemaining = totalAbilityPoints - spentAbilityPoints;

    const totalHEPoints = 18 + 12 * (level - 1);
    const spentHEPoints = (character.healthPoints || 0) + (character.energyPoints || 0);
    const hePointsRemaining = totalHEPoints - spentHEPoints;

    const rawTotalSkillPoints = 2 + level * 3;
    const speciesCount = characterSpeciesSkills.filter((id) => id !== '0').length;
    const hasAnySpeciesSkill = characterSpeciesSkills.some((id) => id === '0');
    const totalSkillPoints = rawTotalSkillPoints - speciesCount + (hasAnySpeciesSkill ? 1 : 0);
    const skillsList = (character.skills || []) as Array<{
      skill_val?: number;
      prof?: boolean;
      baseSkill?: string;
      baseSkillId?: number;
      selectedBaseSkillId?: string;
      name?: string;
      id?: string;
    }>;
    const spentSkillPoints = skillsList.reduce((sum, skill) => {
      let cost = skill.skill_val || 0;
      const isSubSkill =
        Boolean(skill.baseSkill) || skill.baseSkillId != null || skill.selectedBaseSkillId != null;
      if (skill.prof && !isSubSkill) {
        const isSpecies = characterSpeciesSkills.some(
          (ss) =>
            String(ss).toLowerCase() === String(skill.name || '').toLowerCase() ||
            String(ss) === String(skill.id || '')
        );
        if (!isSpecies) cost += 1;
      }
      return sum + cost;
    }, 0);
    const defVals = character.defenseVals || character.defenseSkills || DEFAULT_DEFENSE_SKILLS;
    const spentDefensePoints = Object.values(defVals).reduce(
      (sum: number, val) => sum + ((val as number) || 0) * DEFENSE_INCREASE_COST,
      0
    );
    const skillPointsRemaining = totalSkillPoints - spentSkillPoints - spentDefensePoints;

    const archetypeType = character.archetype?.type || 'power';
    const archetypeFeatSlots = calculateMaxArchetypeFeats(level, archetypeType);
    const characterFeatSlots = calculateMaxCharacterFeats(level);
    const featLevelById = new Map<string, number>();
    (featsDb || []).forEach((f) => {
      const feat = f as Feat & { feat_lvl?: number };
      const lvl = feat.feat_lvl != null && feat.feat_lvl > 0 ? feat.feat_lvl : 1;
      featLevelById.set(String(feat.id), lvl);
    });
    const usedArchetypeFeats = (character.archetypeFeats || []).reduce((sum, feat) => {
      return sum + (featLevelById.get(String(feat.id)) ?? 1);
    }, 0);
    const usedCharacterFeats = (character.feats || []).reduce((sum, feat) => {
      return sum + (featLevelById.get(String(feat.id)) ?? 1);
    }, 0);
    const archetypeFeatsRemaining = archetypeFeatSlots - usedArchetypeFeats;
    const characterFeatsRemaining = characterFeatSlots - usedCharacterFeats;

    return (
      canLevelUp ||
      abilityPointsRemaining > 0 ||
      hePointsRemaining > 0 ||
      skillPointsRemaining > 0 ||
      archetypeFeatsRemaining > 0 ||
      characterFeatsRemaining > 0
    );
  }, [character, characterSpeciesSkills, featsDb, rules]);

  const { archetypeFeatsForDisplay, characterFeatsForDisplay, stateFeatsList } = useMemo(() => {
    const arch = character?.archetypeFeats || [];
    const char = character?.feats || [];
    const db = featsDb as Array<Feat & { state_feat?: boolean }>;
    const isStateFeat = (feat: CharacterFeat) => {
      const codex =
        db.find((f) => f.id === String(feat.id)) ??
        db.find((f) => String(f.name ?? '').toLowerCase() === String(feat.name ?? '').toLowerCase());
      return !!codex?.state_feat;
    };
    const archNonState = arch.filter((f) => !isStateFeat(f));
    const charNonState = char.filter((f) => !isStateFeat(f));
    const stateFeats: Array<CharacterFeat & { type: 'archetype' | 'character' }> = [
      ...arch.filter(isStateFeat).map((f) => ({ ...f, type: 'archetype' as const })),
      ...char.filter(isStateFeat).map((f) => ({ ...f, type: 'character' as const })),
    ];
    return {
      archetypeFeatsForDisplay: archNonState,
      characterFeatsForDisplay: charNonState,
      stateFeatsList: stateFeats,
    };
  }, [character?.archetypeFeats, character?.feats, featsDb]);

  const stateUsesMax = character ? calculateProficiency(character.level || 1) : 0;
  const stateUsesCurrent = character != null ? (character.stateUsesCurrent ?? stateUsesMax) : 0;

  const skills = useMemo((): CharacterSheetSkillRow[] => {
    if (!character) return [];

    const rawSkills = (character.skills || []) as CharacterSheetSkillRow[];

    const rawSkillIds = new Set(rawSkills.map((s) => String(s.id).toLowerCase()));
    const rawSkillNames = new Set(rawSkills.map((s) => String(s.name ?? '').toLowerCase()));
    const merged: CharacterSheetSkillRow[] = [...rawSkills];
    for (const ss of characterSpeciesSkills) {
      const ssId = String(ss);
      const ssLower = ssId.toLowerCase();
      if (rawSkillIds.has(ssLower) || rawSkillNames.has(ssLower)) continue;
      const codexSkill = codexSkills.find(
        (s: Skill) =>
          String(s.id).toLowerCase() === ssLower || String(s.name ?? '').toLowerCase() === ssLower
      );
      if (codexSkill) {
        const abilities = (codexSkill.ability ?? 'strength')
          .split(',')
          .map((a: string) => a.trim().toLowerCase())
          .filter(Boolean);
        merged.push({
          id: String(codexSkill.id),
          name: codexSkill.name ?? ssId,
          skill_val: 0,
          prof: true,
          ability: abilities[0] ?? 'strength',
          availableAbilities: abilities.length ? abilities : ['strength'],
        });
      }
    }

    if (codexSkills.length === 0) return merged;

    return merged.map((skill) => {
      const codexSkill = codexSkills.find(
        (rs: Skill) =>
          String(rs.id) === String(skill.id) ||
          String(rs.name ?? '').toLowerCase() === String(skill.name ?? '').toLowerCase()
      );

      const parentName =
        skill.baseSkill ??
        resolveParentSkillNameForSubSkill(
          skill,
          codexSkill as { base_skill_id?: string | number } | undefined,
          codexSkills as unknown as CodexSkillParentRef[]
        );

      let availableAbilities = skill.availableAbilities;
      let ability = skill.ability;
      if (codexSkill?.ability) {
        const fromCodex = codexSkill.ability
          .split(',')
          .map((a: string) => a.trim().toLowerCase())
          .filter(Boolean);
        if (fromCodex.length > 0) {
          if (!availableAbilities?.length) {
            availableAbilities = fromCodex;
          }
          if (!ability || !fromCodex.includes(ability.toLowerCase())) {
            ability = fromCodex[0] || 'strength';
          }
        }
      }

      return {
        ...skill,
        ability: ability ?? skill.ability ?? 'strength',
        ...(availableAbilities?.length ? { availableAbilities } : {}),
        ...(parentName ? { baseSkill: parentName } : {}),
      };
    });
  }, [character, codexSkills, characterSpeciesSkills]);

  const defaultSkillPointTotal =
    character != null ? calculateSkillPointsForEntity(character.level || 1, 'character') : 0;

  return {
    enrichedData,
    characterSpeciesTraits,
    characterSpeciesSkills,
    characterForDisplay,
    calculatedStats,
    pointBudgets,
    archetypeProgression,
    hasUnappliedPoints,
    skills,
    archetypeFeatsForDisplay,
    characterFeatsForDisplay,
    stateFeatsList,
    stateUsesMax,
    stateUsesCurrent,
    defaultSkillPointTotal,
  };
}
