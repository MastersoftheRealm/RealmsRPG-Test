/**
 * Converts a guided creator draft into a lean Character payload for save.
 */

import type { CodexEquipmentItem } from '@/types/codex';
import type { LibraryItem } from '@/types/library';
import {
  buildEquipmentLookup,
  inventoryTypeForResolvedItem,
  resolveEquipmentRef,
} from '@/lib/guided-creator/resolve-loadout-items';
import type { Character, AbilityName } from '@/types';
import { DEFAULT_DEFENSE_SKILLS } from '@/types';
import { calculateMaxHealth, calculateMaxEnergy } from '@/lib/game/calculations';
import { applySpeciesTraitChoiceSelections } from '@/lib/choice-trait';
import type { TraitWithChoiceOptions } from '@/lib/choice-trait';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import type { Archetype, ArchetypePathData } from '@/types/archetype';
import type { Species, Trait } from '@/hooks';
import { computeStartingCurrency } from '@/lib/guided-creator/equipment-currency';
import { mergeLoadoutArmaments } from '@/lib/guided-creator/resolve-loadout-items';
import { buildSuggestedAbilityArray } from '@/lib/game/suggested-abilities';
import { buildGuidedSkillsArray } from '@/lib/guided-creator/build-skills';

export interface BuildGuidedCharacterContext {
  archetype?: Archetype;
  pathData?: ArchetypePathData;
  species?: Species | null;
  allTraits?: Trait[];
  codexSkills?: Array<{ id: string | number; name?: string; ability?: string; category?: string }>;
  rules?: Parameters<typeof calculateMaxHealth>[5];
  officialItems?: LibraryItem[];
  codexEquipment?: CodexEquipmentItem[];
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
        ...(draft.selectedSize ? { selectedSize: draft.selectedSize } : {}),
      }
    : undefined;

  const speciesSkillIds = (ctx.species?.skills ?? []).map(String);

  const activePathSkillIds = (ctx.pathData?.level1?.skills ?? [])
    .map(String)
    .filter((id) => id !== '0' && !draft.declinedPathSkillIds.map(String).includes(id));

  const skillsForSave = { ...(draft.skills ?? {}) };
  activePathSkillIds.forEach((id) => {
    if (!(id in skillsForSave)) skillsForSave[id] = 0;
  });

  const skillsArray = buildGuidedSkillsArray(skillsForSave, speciesSkillIds, ctx.codexSkills ?? []);

  const archetypeFeats = draft.archetypeFeatIds.map((id) => ({ id, name: String(id) }));
  const characterFeats = draft.characterFeatIds.map((id) => ({ id, name: String(id) }));

  const powers = [
    ...draft.innatePowerIds.map((id) => ({ id, name: String(id), innate: true as const })),
    ...draft.powerIds
      .filter(
        (id) =>
          !draft.innatePowerIds.some(
            (iid) => String(iid).toLowerCase() === String(id).toLowerCase()
          )
      )
      .map((id) => ({ id, name: String(id), innate: false as const })),
  ];
  const techniques = draft.techniqueIds.map((id) => ({ id, name: String(id) }));

  const inventory = (() => {
    const lookup = buildEquipmentLookup(ctx.officialItems, ctx.codexEquipment);
    const rows: Array<{
      id: string;
      name: string;
      quantity: number;
      type: 'weapon' | 'armor' | 'equipment' | 'shield';
    }> = [];

    const pushRow = (ref: { id: string; quantity: number }) => {
      const resolved = resolveEquipmentRef(ref, lookup);
      const key = String(ref.id).trim().toLowerCase();
      const official = ctx.officialItems?.find(
        (i) => String(i.id).trim().toLowerCase() === key
      );
      const codex = ctx.codexEquipment?.find(
        (i) => String(i.id).trim().toLowerCase() === key
      );
      const rawType = String(official?.type ?? codex?.type ?? '').toLowerCase();
      let type: 'weapon' | 'armor' | 'equipment' | 'shield' = inventoryTypeForResolvedItem(resolved);
      if (rawType === 'shield') type = 'shield';

      rows.push({
        id: ref.id,
        name: resolved.name,
        quantity: ref.quantity,
        type,
      });
    };

    const armamentRefs = mergeLoadoutArmaments({
      loadoutWeapons: draft.loadoutWeapons ?? [],
      loadoutArmor: draft.loadoutArmor ?? [],
    });
    const allRefs =
      armamentRefs.length > 0 ? armamentRefs : draft.armaments;
    allRefs.forEach(pushRow);
    draft.equipment.forEach(pushRow);
    return rows;
  })();

  const startingCurrency = computeStartingCurrency(level);
  const savedCurrency =
    typeof draft.currency === 'number' ? draft.currency : startingCurrency;

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
    currency: savedCurrency,
    unarmedProwess: draft.unarmedProwess ?? 0,
    ancestry,
    skills: skillsArray as unknown as Character['skills'],
    archetypeFeats,
    feats: characterFeats,
    powers,
    techniques,
    equipment: {
      inventory,
      weapons: inventory.filter((i) => i.type === 'weapon'),
      armor: inventory.filter((i) => i.type === 'armor'),
      items: inventory.filter((i) => i.type === 'equipment'),
      shields: inventory.filter((i) => i.type === 'shield'),
    },
    defenseVals: { ...DEFAULT_DEFENSE_SKILLS },
    portrait: draft.portraitUrl ?? undefined,
    height: draft.heightCm ?? undefined,
    weight: draft.weightKg ?? undefined,
    appearance: [draft.age ? `Age: ${draft.age}` : '', draft.appearanceNotes?.trim() ?? '']
      .filter(Boolean)
      .join('\n'),
    description: draft.description?.trim() || undefined,
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
