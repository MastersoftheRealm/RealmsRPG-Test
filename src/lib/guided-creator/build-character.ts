/**
 * Converts a guided creator draft into a lean Character payload for save.
 * Mirrors custom creator `getCharacter()` save practices: lean refs + computed
 * proficiencies from library parts/properties (powers/items are stripped by cleanForSave).
 */

import type { CodexEquipmentItem } from '@/types/codex';
import type { LibraryItem, LibraryPower, LibraryTechnique } from '@/types/library';
import {
  buildEquipmentLookup,
  inventoryTypeForResolvedItem,
  resolveEquipmentRef,
} from '@/lib/guided-creator/resolve-loadout-items';
import type {
  AbilityName,
  Character,
  CharacterPower,
  CharacterTechnique,
  Item,
} from '@/types';
import { DEFAULT_DEFENSE_SKILLS } from '@/types';
import { calculateMaxHealth, calculateMaxEnergy } from '@/lib/game/calculations';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import type { Archetype, ArchetypePathData } from '@/types/archetype';
import type { Species } from '@/hooks';
import { averageMixedPhysical } from '@/lib/ancestry/ancestry-selection';
import { computeStartingCurrency } from '@/lib/guided-creator/equipment-currency';
import { mergeLoadoutArmaments } from '@/lib/guided-creator/resolve-loadout-items';
import { buildSuggestedAbilityArray } from '@/lib/game/suggested-abilities';
import { buildCreatorSkillSaveRows } from '@/lib/creator/build-creator-skills';
import { buildRequiredProficiencies } from '@/lib/proficiencies';
import { defaultLibraryTabVisibilityForArchetype } from '@/lib/character-library-tab-visibility';
import {
  applyStarterEquippedFlags,
  itemDamageReduction,
} from '@/lib/game/equipment-equipped';
import { normalizeId } from '@/lib/utils';
import { dedupeEntityRefs } from '@/lib/library/dedupe-saved-parts';

interface CodexPartLike {
  id?: string | number;
  name?: string;
  base_tp?: number;
  op_1_tp?: number;
  op_2_tp?: number;
  op_3_tp?: number;
}

interface CodexPropertyLike {
  id?: string | number;
  name?: string;
  base_tp?: number;
  op_1_tp?: number;
}

export interface BuildGuidedCharacterContext {
  archetype?: Archetype;
  pathData?: ArchetypePathData;
  species?: Species | null;
  /** Mixed species parents for save enrichment. */
  speciesA?: Species | null;
  speciesB?: Species | null;
  codexSkills?: Array<{ id: string | number; name?: string; ability?: string; category?: string }>;
  /** Codex feats — resolve archetype/character feat display names on save. */
  codexFeats?: Array<{ id?: string | number; name?: string }>;
  rules?: Parameters<typeof calculateMaxHealth>[5];
  officialItems?: LibraryItem[];
  codexEquipment?: CodexEquipmentItem[];
  /** Official library powers — needed to resolve parts for proficiency build. */
  officialPowers?: LibraryPower[];
  /** Official library techniques — needed to resolve parts for proficiency build. */
  officialTechniques?: LibraryTechnique[];
  powerPartsDb?: CodexPartLike[];
  techniquePartsDb?: CodexPartLike[];
  itemPropertiesDb?: CodexPropertyLike[];
}

function findByNormalizedId<T extends { id?: string | number }>(
  list: T[] | undefined,
  id: string | number
): T | undefined {
  const key = normalizeId(id);
  if (!key) return undefined;
  return list?.find((row) => normalizeId(row.id) === key);
}

/** Resolve draft power ids to CharacterPower shapes with parts/damage for proficiency TP. */
function resolvePowersForProficiency(
  draft: GuidedDraft,
  officialPowers: LibraryPower[] = []
): CharacterPower[] {
  const innatePowerIds = dedupeEntityRefs(draft.innatePowerIds ?? []);
  const innateKeys = new Set(innatePowerIds.map((id) => normalizeId(id)));
  const orderedIds = [
    ...innatePowerIds,
    ...dedupeEntityRefs(draft.powerIds ?? []).filter((id) => !innateKeys.has(normalizeId(id))),
  ];

  return orderedIds.map((id) => {
    const lib = findByNormalizedId(officialPowers, id);
    return {
      id,
      name: lib?.name ?? String(id),
      innate: innateKeys.has(normalizeId(id)),
      parts: lib?.parts ?? [],
      damage: lib?.damage,
    } as CharacterPower;
  });
}

function resolveTechniquesForProficiency(
  draft: GuidedDraft,
  officialTechniques: LibraryTechnique[] = []
): CharacterTechnique[] {
  return dedupeEntityRefs(draft.techniqueIds ?? []).map((id) => {
    const lib = findByNormalizedId(officialTechniques, id);
    return {
      id,
      name: lib?.name ?? String(id),
      parts: lib?.parts ?? [],
      damage: lib?.damage,
    } as CharacterTechnique;
  });
}

/** Armaments with properties/damage so buildRequiredProficiencies can compute TP. */
function resolveArmamentsForProficiency(
  inventory: Array<{ id: string; name: string; type: string }>,
  officialItems: LibraryItem[] = [],
  codexEquipment: CodexEquipmentItem[] = []
): { weapons: Item[]; shields: Item[]; armor: Item[] } {
  const toItem = (row: { id: string; name: string }): Item => {
    const official = findByNormalizedId(officialItems, row.id);
    if (official) {
      return {
        id: row.id,
        name: official.name || row.name,
        properties: (official.properties ?? []) as Item['properties'],
        damage: official.damage as Item['damage'],
      } as Item;
    }
    const codex = findByNormalizedId(codexEquipment, row.id);
    if (codex) {
      return {
        id: row.id,
        name: codex.name || row.name,
        properties: (codex.properties ?? []).map((name) => ({ name })),
        damage: codex.damage,
      } as Item;
    }
    return { id: row.id, name: row.name, properties: [] } as Item;
  };

  return {
    weapons: inventory.filter((i) => i.type === 'weapon').map(toItem),
    shields: inventory.filter((i) => i.type === 'shield').map(toItem),
    armor: inventory.filter((i) => i.type === 'armor').map(toItem),
  };
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

  const mixedPhysical =
    draft.speciesMixed && ctx.speciesA && ctx.speciesB
      ? averageMixedPhysical(ctx.speciesA, ctx.speciesB)
      : null;

  // Species traits are derived from the species codex on the sheet — do not
  // persist them into selectedTraits (that caused duplicate trait rows).
  // Keep choice resolutions so choice-trait options still apply on load.
  const ancestry = draft.speciesId
    ? {
        id: draft.speciesId,
        name: draft.speciesName ?? ctx.species?.name ?? '',
        // DESIGN_INTENT: selectedTraits = ancestry picks only (not species_traits).
        selectedTraits: dedupeEntityRefs(draft.selectedAncestryTraitIds ?? []),
        selectedFlaw: draft.selectedFlawId,
        selectedCharacteristic: draft.selectedCharacteristicId,
        selectedSpeciesTraitChoices: draft.selectedSpeciesTraitChoices,
        ...(draft.speciesMixed && draft.mixedSpeciesIds
          ? {
              mixed: true as const,
              speciesIds: draft.mixedSpeciesIds,
              ...(draft.mixedSpeciesNames ? { speciesNames: draft.mixedSpeciesNames } : {}),
              ...(draft.selectedSpeciesTraits.length >= 2
                ? {
                    selectedSpeciesTraits: [
                      draft.selectedSpeciesTraits[0],
                      draft.selectedSpeciesTraits[1],
                    ] as [string, string],
                  }
                : {}),
              ...(draft.selectedFlawSpeciesId
                ? { selectedFlawSpeciesId: draft.selectedFlawSpeciesId }
                : {}),
              ...(mixedPhysical ? { mixedPhysical } : {}),
              ...(draft.selectedSpeciesSkillIds.length > 0
                ? { selectedSpeciesSkillIds: draft.selectedSpeciesSkillIds }
                : {}),
            }
          : {}),
        ...(draft.selectedSize ? { selectedSize: draft.selectedSize } : {}),
      }
    : undefined;

  const speciesSkillIds =
    draft.speciesMixed && draft.selectedSpeciesSkillIds.length > 0
      ? draft.selectedSpeciesSkillIds.map(String)
      : (ctx.species?.skills ?? []).map(String);

  const activePathSkillIds = (ctx.pathData?.level1?.skills ?? [])
    .map(String)
    .filter((id) => id !== '0' && !draft.declinedPathSkillIds.map(String).includes(id));

  const skillsForSave = { ...(draft.skills ?? {}) };
  activePathSkillIds.forEach((id) => {
    if (!(id in skillsForSave)) skillsForSave[id] = 0;
  });

  const skillsArray = buildCreatorSkillSaveRows(skillsForSave, {
    speciesSkillIds,
    codexSkills: ctx.codexSkills ?? [],
  });

  // Lean save refs — resolve feat names from codex (same pattern as powers/techniques).
  const resolveFeatRef = (id: string) => {
    const feat = findByNormalizedId(ctx.codexFeats, id);
    return { id, name: feat?.name?.trim() || String(id) };
  };
  const archetypeFeats = dedupeEntityRefs(draft.archetypeFeatIds.map(resolveFeatRef));
  const characterFeats = dedupeEntityRefs(draft.characterFeatIds.map(resolveFeatRef));

  // Lean save refs (parts stripped by cleanForSave) — resolve names from official library.
  const innatePowerIds = dedupeEntityRefs(draft.innatePowerIds ?? []);
  const innateKeys = new Set(innatePowerIds.map((id) => normalizeId(id)));
  const powersForSave: CharacterPower[] = [
    ...innatePowerIds.map((id) => {
      const lib = findByNormalizedId(ctx.officialPowers, id);
      return { id, name: lib?.name ?? String(id), innate: true as const };
    }),
    ...dedupeEntityRefs(draft.powerIds ?? [])
      .filter((id) => !innateKeys.has(normalizeId(id)))
      .map((id) => {
        const lib = findByNormalizedId(ctx.officialPowers, id);
        return { id, name: lib?.name ?? String(id), innate: false as const };
      }),
  ];
  const techniquesForSave: CharacterTechnique[] = dedupeEntityRefs(draft.techniqueIds ?? []).map(
    (id) => {
      const lib = findByNormalizedId(ctx.officialTechniques, id);
      return { id, name: lib?.name ?? String(id) };
    }
  );

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
      const official = findByNormalizedId(ctx.officialItems, ref.id);
      const codex = findByNormalizedId(ctx.codexEquipment, ref.id);
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

  const drForInventoryRow = (row: { id: string }) => {
    const official = findByNormalizedId(ctx.officialItems, row.id);
    if (official) return itemDamageReduction(official);
    const codex = findByNormalizedId(ctx.codexEquipment, row.id);
    if (codex) {
      return itemDamageReduction({
        armorValue: codex.armor_value,
        properties: codex.properties?.map((name) => ({ name })),
      });
    }
    return 0;
  };

  const equippedInventory = applyStarterEquippedFlags(inventory, drForInventoryRow);

  // DESIGN_INTENT: Guided drafts store lean ids only. Resolve parts/properties from
  // official/codex libraries here so buildRequiredProficiencies matches custom
  // getCharacter(), then persist the computed list — cleanForSave strips power/item
  // parts but keeps `proficiencies` (SAVEABLE_FIELDS).
  const powersForProf = resolvePowersForProficiency(draft, ctx.officialPowers);
  const techniquesForProf = resolveTechniquesForProficiency(draft, ctx.officialTechniques);
  const armamentsForProf = resolveArmamentsForProficiency(
    equippedInventory,
    ctx.officialItems,
    ctx.codexEquipment
  );
  const proficiencies = buildRequiredProficiencies({
    powers: powersForProf,
    techniques: techniquesForProf,
    weapons: armamentsForProf.weapons,
    shields: armamentsForProf.shields,
    armor: armamentsForProf.armor,
    powerPartsDb: ctx.powerPartsDb ?? [],
    techniquePartsDb: ctx.techniquePartsDb ?? [],
    itemPropertiesDb: ctx.itemPropertiesDb ?? [],
  });

  const startingCurrency = computeStartingCurrency(level);
  const savedCurrency =
    typeof draft.currency === 'number' ? draft.currency : startingCurrency;

  // DESIGN_INTENT: same libraryTabVisibility prefs as sheet eye toggle (TASK-501).
  const libraryTabVisibility = defaultLibraryTabVisibilityForArchetype(type);

  const archetypePayload = ctx.archetype
    ? { id: String(ctx.archetype.id), type }
    : { id: type, type };

  return {
    name: draft.name.trim() || 'Unnamed Character',
    level,
    status: 'complete',
    abilities,
    ...(draft.archetypePathId ? { archetypePathId: draft.archetypePathId } : {}),
    archetype: archetypePayload,
    ...(powAbil && { pow_abil: powAbil }),
    ...(martAbil && { mart_abil: martAbil }),
    mart_prof: type === 'martial' ? 2 : type === 'powered-martial' ? 1 : 0,
    pow_prof: type === 'power' ? 2 : type === 'powered-martial' ? 1 : 0,
    healthPoints: hpAlloc,
    energyPoints: enAlloc,
    currentHealth: maxHealth,
    currentEnergy: maxEnergy,
    health: { current: maxHealth, max: maxHealth },
    energy: { current: maxEnergy, max: maxEnergy },
    currency: savedCurrency,
    unarmedProwess: draft.unarmedProwess ?? 0,
    ancestry,
    skills: skillsArray as unknown as Character['skills'],
    archetypeFeats,
    feats: characterFeats,
    powers: powersForSave,
    techniques: techniquesForSave,
    equipment: {
      inventory: equippedInventory,
      weapons: equippedInventory.filter((i) => i.type === 'weapon'),
      armor: equippedInventory.filter((i) => i.type === 'armor'),
      items: equippedInventory.filter((i) => i.type === 'equipment'),
      shields: equippedInventory.filter((i) => i.type === 'shield'),
    },
    proficiencies,
    ...(libraryTabVisibility && { libraryTabVisibility }),
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
