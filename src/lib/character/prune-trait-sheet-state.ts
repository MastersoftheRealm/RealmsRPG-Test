/**
 * Drop trait use / customization entries that no longer belong on the character
 * after an ancestry (species) change.
 */

import type { Character, CharacterAncestry } from '@/types';
import type { Species, Trait } from '@/hooks/codex-types';
import { applySpeciesTraitChoiceSelections } from '@/lib/choice-trait';
import { collectSheetTraits } from '@/lib/character/collect-sheet-traits';
import { normalizeId } from '@/lib/utils/normalize-id';

function resolveSpeciesTraitRefs(
  ancestry: CharacterAncestry | undefined,
  speciesLabel: string | undefined,
  allSpecies: Species[],
  traitsDb: Trait[],
): string[] {
  if (!ancestry) return [];

  if (ancestry.mixed === true && Array.isArray(ancestry.selectedSpeciesTraits)) {
    const ids = ancestry.selectedSpeciesTraits
      .map((id) => (id != null ? String(id).trim() : ''))
      .filter((id) => id.length > 0);
    if (ids.length > 0) return ids;
  }

  const speciesId = ancestry.id;
  const speciesName = ancestry.name || speciesLabel;
  let species = allSpecies.find((s) => String(s.id) === String(speciesId));
  if (!species && speciesName) {
    species = allSpecies.find(
      (s) => String(s.name ?? '').toLowerCase() === String(speciesName ?? '').toLowerCase(),
    );
  }
  const raw = species?.species_traits || [];
  const choices = ancestry.selectedSpeciesTraitChoices;
  return applySpeciesTraitChoiceSelections(raw, choices, traitsDb);
}

function resolveTraitDisplayName(
  traitNameOrId: string,
  traitsDb: Array<{ id: string; name?: string | undefined }>,
): string {
  const byName = traitsDb.find(
    (t) => String(t.name ?? '').toLowerCase() === String(traitNameOrId ?? '').toLowerCase(),
  );
  if (byName?.name) return byName.name;
  const byId = traitsDb.find((t) => t.id === traitNameOrId);
  return byId?.name ?? traitNameOrId;
}

function traitCustomizationKey(
  traitNameOrId: string,
  traitsDb: Array<{ id: string; name?: string | undefined }>,
): string {
  const byId = traitsDb.find((t) => t.id === traitNameOrId);
  if (byId) return byId.id;
  const byName = traitsDb.find(
    (t) => String(t.name ?? '').toLowerCase() === String(traitNameOrId ?? '').toLowerCase(),
  );
  return byName?.id ?? traitNameOrId;
}

export function pruneTraitSheetStateAfterAncestryChange(
  character: Pick<
    Character,
    | 'traitUses'
    | 'traitCustomizations'
    | 'traits'
    | 'ancestryTraits'
    | 'flawTrait'
    | 'characteristicTrait'
    | 'speciesTraits'
    | 'species'
  >,
  newAncestry: CharacterAncestry,
  allSpecies: Species[],
  traitsDb: Trait[],
): Pick<Character, 'traitUses' | 'traitCustomizations'> {
  const speciesTraitsFromCodex = resolveSpeciesTraitRefs(
    newAncestry,
    character.species,
    allSpecies,
    traitsDb,
  );

  const rows = collectSheetTraits({
    speciesTraitsFromCodex,
    ancestry: newAncestry,
    vanillaTraits: {
      ancestryTraits: character.ancestryTraits,
      flawTrait: character.flawTrait,
      characteristicTrait: character.characteristicTrait,
      speciesTraits: character.speciesTraits,
    },
    legacyTraits: character.traits,
  });

  const activeNameKeys = new Set(
    rows.map((row) => normalizeId(resolveTraitDisplayName(row.name, traitsDb))),
  );
  const activeCustomizationKeys = new Set(
    rows.map((row) => traitCustomizationKey(resolveTraitDisplayName(row.name, traitsDb), traitsDb)),
  );

  const nextTraitUses: Record<string, number> = {};
  if (character.traitUses) {
    for (const [key, value] of Object.entries(character.traitUses)) {
      const canonical = normalizeId(resolveTraitDisplayName(key, traitsDb));
      if (activeNameKeys.has(canonical)) {
        nextTraitUses[key] = value;
      }
    }
  }

  const nextCustomizations: Record<string, NonNullable<Character['traitCustomizations']>[string]> =
    {};
  if (character.traitCustomizations) {
    for (const [key, value] of Object.entries(character.traitCustomizations)) {
      if (activeCustomizationKeys.has(key)) {
        nextCustomizations[key] = value;
      }
    }
  }

  return {
    traitUses: Object.keys(nextTraitUses).length > 0 ? nextTraitUses : undefined,
    traitCustomizations:
      Object.keys(nextCustomizations).length > 0 ? nextCustomizations : undefined,
  };
}
