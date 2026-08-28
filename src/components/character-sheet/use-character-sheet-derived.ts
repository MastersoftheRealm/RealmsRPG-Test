/**
 * Character Sheet — derived data (memos extracted from page.tsx for TASK-348).
 */

'use client';

import { useMemo } from 'react';
import type { Archetype, Character, CharacterFeat } from '@/types';
import type { CodexFeat, CodexSkill, Species, Trait } from '@/hooks/codex-types';
import { DEFAULT_DEFENSE_SKILLS } from '@/types/skills';
import { enrichCharacterData } from '@/lib/data-enrichment';
import {
  calculateAbilityPoints,
  calculateAbilityScoreCost,
  calculateArchetypeProgression,
  calculateProficiency,
  calculateSkillPointsForEntity,
  resolveParentSkillNameForSubSkill,
} from '@/lib/game/formulas';
import {
  buildSheetEditNotification,
  computeSheetPointPools,
  type SheetEditNotification,
} from '@/lib/character/sheet-edit-notification';
import { getArchetypeCodexLookupId, mergeArchetypeFromCodex } from '@/lib/game/archetype-display';
import {
  calculateCharacterSkillPointsSpent,
  buildSpeciesSkillIdSet,
} from '@/lib/game/skill-allocation';
import { applySpeciesTraitChoiceSelections } from '@/lib/choice-trait';
import type { CoreRulesMap } from '@/types/core-rules';
import type { LibraryForView } from '@/services/character-service';
import type { UserItem, UserPower, UserTechnique } from '@/hooks/use-user-library';
import {
  calculateStats,
  type CharacterSheetStats,
} from '@/app/(main)/characters/[id]/character-sheet-utils';
import type { LibrarySectionData } from './library-section-props';

export type { CharacterSheetStats };

export interface CharacterSheetSkillRow {
  id: string;
  name: string;
  category?: string | undefined;
  skill_val: number;
  prof?: boolean | undefined;
  baseSkill?: string | undefined;
  selectedBaseSkillId?: string | undefined;
  ability?: string | undefined;
  availableAbilities?: string[] | undefined;
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
  handleRemovePower: NonNullable<LibrarySectionData['onRemovePower']>;
  handleTogglePowerInnate: NonNullable<LibrarySectionData['onTogglePowerInnate']>;
  handleUsePower: NonNullable<LibrarySectionData['onUsePower']>;
  handleRemoveTechnique: NonNullable<LibrarySectionData['onRemoveTechnique']>;
  handleUseTechnique: NonNullable<LibrarySectionData['onUseTechnique']>;
  handleRemoveWeapon: NonNullable<LibrarySectionData['onRemoveWeapon']>;
  handleToggleEquipWeapon: NonNullable<LibrarySectionData['onToggleEquipWeapon']>;
  handleRemoveShield: NonNullable<LibrarySectionData['onRemoveShield']>;
  handleToggleEquipShield: NonNullable<LibrarySectionData['onToggleEquipShield']>;
  handleRemoveArmor: NonNullable<LibrarySectionData['onRemoveArmor']>;
  handleToggleEquipArmor: NonNullable<LibrarySectionData['onToggleEquipArmor']>;
  handleRemoveEquipment: NonNullable<LibrarySectionData['onRemoveEquipment']>;
  handleEquipmentQuantityChange: NonNullable<LibrarySectionData['onEquipmentQuantityChange']>;
  handleCurrencyChange: NonNullable<LibrarySectionData['onCurrencyChange']>;
  handleStateUsesChange: NonNullable<LibrarySectionData['onStateUsesChange']>;
  handleEnterState: NonNullable<LibrarySectionData['onEnterState']>;
  handleFeatUsesChange: NonNullable<LibrarySectionData['onFeatUsesChange']>;
  handleFeatLevelChange: NonNullable<LibrarySectionData['onFeatLevelChange']>;
  handleRequestRemoveFeat: NonNullable<LibrarySectionData['onRemoveFeat']>;
  handleTraitUsesChange: NonNullable<LibrarySectionData['onTraitUsesChange']>;
  handleFeatCustomizationChange: NonNullable<LibrarySectionData['onFeatCustomizationChange']>;
  handleTraitCustomizationChange: NonNullable<LibrarySectionData['onTraitCustomizationChange']>;
}

export interface UseCharacterSheetDerivedArgs {
  character: Character | null;
  libraryForView: LibraryForView | undefined;
  userPowers: UserPower[];
  userTechniques: UserTechnique[];
  userEmpoweredTechniques: UserTechnique[];
  userItems: UserItem[];
  codexEquipment: unknown[];
  powerPartsDb: LibrarySectionData['powerPartsDb'];
  techniquePartsDb: LibrarySectionData['techniquePartsDb'];
  itemPropertiesDb: LibrarySectionData['itemPropertiesDb'];
  publicLibraries: {
    powers: UserPower[];
    techniques: UserTechnique[];
    items: UserItem[];
  };
  allSpecies: Species[];
  traitsDb: Trait[];
  codexSkills: CodexSkill[];
  codexArchetypes: Archetype[];
  featsDb: CodexFeat[];
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
    const powers = libraryForView ? libraryForView.powers : userPowers;
    const baseTechniques = libraryForView ? libraryForView.techniques : userTechniques;
    const techniques = [...baseTechniques, ...userEmpoweredTechniques];
    const items = libraryForView ? libraryForView.items : userItems;
    return enrichCharacterData(
      character,
      powers,
      techniques,
      items,
      codexEquipment as Parameters<typeof enrichCharacterData>[4],
      powerPartsDb as Parameters<typeof enrichCharacterData>[5],
      techniquePartsDb as Parameters<typeof enrichCharacterData>[6],
      publicLibraries,
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
        (s: Species) =>
          String(s.name ?? '').toLowerCase() === String(speciesName ?? '').toLowerCase(),
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
        (s: Species) =>
          String(s.name ?? '').toLowerCase() === String(speciesName ?? '').toLowerCase(),
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
      0,
    );

    const totalSkillPoints = calculateSkillPointsForEntity(level, 'character', rules);

    const skillsList = (character.skills || []) as Array<{
      skill_val?: number | undefined;
      prof?: boolean | undefined;
      baseSkill?: string | undefined;
      baseSkillId?: number | undefined;
      selectedBaseSkillId?: string | undefined;
      name?: string | undefined;
      id?: string | undefined;
    }>;
    const speciesSkillIdSet = buildSpeciesSkillIdSet(
      characterSpeciesSkills.filter((id) => id !== '0'),
      skillsList,
    );
    const defVals = character.defenseVals || character.defenseSkills || DEFAULT_DEFENSE_SKILLS;
    const spentSkillPoints = calculateCharacterSkillPointsSpent(
      skillsList,
      speciesSkillIdSet,
      defVals,
      rules,
    );

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
      character.archetypeChoices || {},
    );
  }, [character]);

  const sheetEditNotification = useMemo((): SheetEditNotification => {
    if (!character) {
      return { show: false, severity: 'none', title: '' };
    }

    const pools = computeSheetPointPools({
      character,
      characterSpeciesSkills,
      featsDb: featsDb || [],
      rules,
    });
    return buildSheetEditNotification(pools);
  }, [character, characterSpeciesSkills, featsDb, rules]);

  const { archetypeFeatsForDisplay, characterFeatsForDisplay, stateFeatsList } = useMemo(() => {
    const arch = character?.archetypeFeats || [];
    const char = character?.feats || [];
    const db = featsDb as Array<CodexFeat & { state_feat?: boolean | undefined }>;
    const isStateFeat = (feat: CharacterFeat) => {
      const codex =
        db.find((f) => f.id === String(feat.id)) ??
        db.find(
          (f) => String(f.name ?? '').toLowerCase() === String(feat.name ?? '').toLowerCase(),
        );
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

  const stateUsesMax = character ? calculateProficiency(character.level || 1, false, rules) : 0;
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
        (s: CodexSkill) =>
          String(s.id).toLowerCase() === ssLower || String(s.name ?? '').toLowerCase() === ssLower,
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
        (rs: CodexSkill) =>
          String(rs.id) === String(skill.id) ||
          String(rs.name ?? '').toLowerCase() === String(skill.name ?? '').toLowerCase(),
      );

      const parentName =
        skill.baseSkill ??
        resolveParentSkillNameForSubSkill(
          skill,
          codexSkill as { base_skill_id?: string | number | undefined } | undefined,
          codexSkills,
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

  return {
    enrichedData,
    characterSpeciesTraits,
    characterSpeciesSkills,
    characterForDisplay,
    calculatedStats,
    pointBudgets,
    archetypeProgression,
    sheetEditNotification,
    skills,
    archetypeFeatsForDisplay,
    characterFeatsForDisplay,
    stateFeatsList,
    stateUsesMax,
    stateUsesCurrent,
  };
}
