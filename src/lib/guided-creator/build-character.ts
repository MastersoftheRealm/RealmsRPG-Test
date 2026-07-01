/**
 * Converts a guided creator draft into a lean Character payload for save.
 */

import type { Character, AbilityName } from '@/types';
import { DEFAULT_DEFENSE_SKILLS } from '@/types';
import { calculateMaxHealth, calculateMaxEnergy } from '@/lib/game/calculations';
import { applySpeciesTraitChoiceSelections } from '@/lib/choice-trait';
import type { TraitWithChoiceOptions } from '@/lib/choice-trait';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import type { Archetype, ArchetypePathData } from '@/types/archetype';
import type { Species, Trait } from '@/hooks';
import { CHARACTER_STARTING_CURRENCY } from '@/stores/character-creator-store';
import { buildSuggestedAbilityArray } from '@/lib/game/suggested-abilities';

export interface BuildGuidedCharacterContext {
  archetype?: Archetype;
  pathData?: ArchetypePathData;
  species?: Species | null;
  allTraits?: Trait[];
  codexSkills?: Array<{ id: string | number; name?: string; ability?: string; category?: string }>;
  rules?: Parameters<typeof calculateMaxHealth>[5];
}

export function buildGuidedCharacterPayload(
  draft: GuidedDraft,
  ctx: BuildGuidedCharacterContext
): Partial<Character> {
  const level = 1;
  const abilities = draft.abilities;
  const powAbil = draft.pow_abil ?? undefined;
  const martAbil = draft.mart_abil ?? undefined;
  const type = draft.archetypeType ?? ctx.archetype?.type ?? 'martial';

  const hpAlloc = draft.hpAllocated ?? 0;
  const enAlloc = draft.energyAllocated ?? 0;

  const maxHealth = calculateMaxHealth(
    hpAlloc,
    abilities.vitality || 0,
    level,
    powAbil,
    abilities,
    ctx.rules,
    martAbil
  );
  const maxEnergy = calculateMaxEnergy(enAlloc, powAbil || martAbil, abilities, level);

  const resolvedSpeciesTraits = applySpeciesTraitChoiceSelections(
    ctx.species?.species_traits,
    draft.selectedSpeciesTraitChoices,
    (ctx.allTraits ?? []) as TraitWithChoiceOptions[]
  );

  const ancestry = draft.speciesId
    ? {
        id: draft.speciesId,
        name: draft.speciesName ?? ctx.species?.name ?? '',
        selectedTraits: [...resolvedSpeciesTraits, ...draft.selectedAncestryTraitIds],
        selectedFlaw: draft.selectedFlawId,
        selectedCharacteristic: draft.selectedCharacteristicId,
        selectedSpeciesTraitChoices: draft.selectedSpeciesTraitChoices,
      }
    : undefined;

  const skillsRecord: Record<string, number> = {};
  draft.skillIds.forEach((id) => {
    skillsRecord[id] = 1;
  });

  const skillsArray = draft.skillIds.map((skillId) => {
    const skillData = ctx.codexSkills?.find((s) => String(s.id) === String(skillId));
    return {
      id: skillId,
      name: skillData?.name ?? skillId,
      category: skillData?.category || skillData?.ability?.split(',')[0]?.trim() || 'other',
      skill_val: 1,
      prof: true,
      ability: skillData?.ability?.split(',')[0]?.trim().toLowerCase(),
    };
  });

  const archetypeFeats = draft.archetypeFeatIds.map((id) => ({ id, name: String(id) }));
  const characterFeats = draft.characterFeatIds.map((id) => ({ id, name: String(id) }));

  const powers = draft.powerIds.map((id) => ({ id, name: String(id) }));
  const techniques = draft.techniqueIds.map((id) => ({ id, name: String(id) }));

  const inventory = [
    ...draft.armaments.map((a) => ({ id: a.id, name: a.id, quantity: a.quantity, type: 'weapon' as const })),
    ...draft.equipment.map((e) => ({ id: e.id, name: e.id, quantity: e.quantity, type: 'equipment' as const })),
  ];

  return {
    name: draft.name.trim() || 'Unnamed Character',
    level,
    abilities,
    creationMode: 'path',
    ...(draft.archetypePathId && { archetypePathId: draft.archetypePathId }),
    ...(ctx.archetype && {
      archetype: {
        id: String(ctx.archetype.id),
        type,
      },
    }),
    ...(powAbil && { pow_abil: powAbil }),
    ...(martAbil && { mart_abil: martAbil }),
    mart_prof: type === 'martial' ? 2 : type === 'powered-martial' ? 1 : 0,
    pow_prof: type === 'power' ? 2 : type === 'powered-martial' ? 1 : 0,
    healthPoints: hpAlloc,
    energyPoints: enAlloc,
    health: { current: maxHealth, max: maxHealth },
    energy: { current: maxEnergy, max: maxEnergy },
    currency: CHARACTER_STARTING_CURRENCY,
    ancestry,
    skills: skillsArray as unknown as Character['skills'],
    archetypeFeats,
    feats: characterFeats,
    powers,
    techniques,
    equipment: {
      inventory,
      weapons: inventory.filter((i) => i.type === 'weapon'),
      armor: [],
      items: inventory.filter((i) => i.type === 'equipment'),
      shields: [],
    },
    defenseVals: { ...DEFAULT_DEFENSE_SKILLS },
    portrait: draft.portraitUrl ?? undefined,
    appearance: [
      draft.age ? `Age: ${draft.age}` : '',
      draft.heightCm ? `Height: ${draft.heightCm} cm` : '',
      draft.weightKg ? `Weight: ${draft.weightKg} kg` : '',
      draft.appearanceNotes?.trim() ?? '',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}

/** Apply path recommended abilities when present; else build from primary/secondary. */
export function resolveGuidedRecommendedAbilities(
  pathData: ArchetypePathData | undefined,
  primary?: AbilityName | null,
  secondary?: AbilityName | null
): Record<AbilityName, number> | null {
  const fromPath = pathData?.level1?.recommended_abilities;
  if (fromPath && Object.keys(fromPath).length > 0) {
    return {
      strength: fromPath.strength ?? 0,
      vitality: fromPath.vitality ?? 0,
      agility: fromPath.agility ?? 0,
      acuity: fromPath.acuity ?? 0,
      intelligence: fromPath.intelligence ?? 0,
      charisma: fromPath.charisma ?? 0,
    };
  }
  if (!primary) return null;
  return buildSuggestedAbilityArray(1, primary, secondary ?? undefined);
}
