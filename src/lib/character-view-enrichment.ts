/**
 * Referenced enrichment for read-only character views (TASK-773 / ADR-0015).
 *
 * Client-safe: ID collection + empty payload + sheet catalog mapping.
 * Fetch lives in `character-view-enrichment-server.ts`.
 */

import { getArchetypeCodexLookupId } from '@/lib/game/archetype-display';
import type { Archetype, Character } from '@/types';
import type {
  CodexEquipmentItem,
  CodexFeat,
  CodexItemProperty,
  CodexPowerPart,
  CodexSkill,
  CodexSpecies,
  CodexTechniquePart,
  CodexTrait,
} from '@/types/codex';
import type { LibraryItem, LibraryPower, LibraryTechnique } from '@/types/library';

/** Equipment containers that may hold library item refs (array or single object). */
const EQUIPMENT_KEYS = [
  'weapons',
  'shields',
  'armor',
  'items',
  'accessories',
  'inventory',
  'mainHand',
  'offHand',
] as const;

/**
 * Refs are stored as `{ id, name }` objects today, but older saves and the two
 * roster key spellings mean the id can also arrive as a number, under `docId`,
 * or as a bare id string.
 */
function collectRefIds(value: unknown, into: Set<string>): void {
  if (value == null) return;

  if (Array.isArray(value)) {
    for (const entry of value) collectRefIds(entry, into);
    return;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const id = String(value).trim();
    if (id) into.add(id);
    return;
  }

  if (typeof value === 'object') {
    const ref = value as { id?: unknown; docId?: unknown; refId?: unknown };
    for (const candidate of [ref.id, ref.docId, ref.refId]) {
      if (typeof candidate === 'string' || typeof candidate === 'number') {
        const id = String(candidate).trim();
        if (id) into.add(id);
      }
    }
  }
}

function collectSkillIds(skills: unknown, into: Set<string>): void {
  if (Array.isArray(skills)) {
    collectRefIds(skills, into);
    return;
  }
  if (skills && typeof skills === 'object' && !Array.isArray(skills)) {
    for (const key of Object.keys(skills as Record<string, unknown>)) {
      const id = key.trim();
      if (id) into.add(id);
    }
  }
}

function collectProficiencyIds(
  proficiencies: unknown,
  parts: Set<string>,
  properties: Set<string>,
): void {
  if (!Array.isArray(proficiencies)) return;
  for (const entry of proficiencies) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as { kind?: unknown; id?: unknown; refId?: unknown };
    const kind = typeof row.kind === 'string' ? row.kind : '';
    if (kind === 'custom') continue;
    const target = kind === 'item_property' ? properties : parts;
    collectRefIds(row.refId ?? row.id, target);
  }
}

/** Library entity ids a character actually references, per library table. */
export interface OwnerLibraryRefIds {
  powers: string[];
  techniques: string[];
  items: string[];
  creatures: string[];
}

/**
 * Resolve the library entity ids a stored character document references.
 * Characters do not reference creatures today, so that set is always empty —
 * keep it in the shape so the response contract stays stable.
 */
export function collectCharacterLibraryRefIds(characterData: unknown): OwnerLibraryRefIds {
  const data = (characterData ?? {}) as Record<string, unknown>;
  const equipment = (data.equipment ?? {}) as Record<string, unknown>;

  const itemIds = new Set<string>();
  for (const key of EQUIPMENT_KEYS) {
    collectRefIds(equipment[key], itemIds);
  }

  const powers = new Set<string>();
  const techniques = new Set<string>();
  const creatures = new Set<string>();
  collectRefIds(data.powers, powers);
  collectRefIds(data.techniques, techniques);
  collectRefIds(data.creatures, creatures);

  return {
    powers: [...powers],
    techniques: [...techniques],
    items: [...itemIds],
    creatures: [...creatures],
  };
}

/** IDs a stored character document needs resolved for a read-only sheet. */
export interface CharacterViewRefIds {
  powers: string[];
  techniques: string[];
  items: string[];
  creatures: string[];
  feats: string[];
  skills: string[];
  species: string[];
  traits: string[];
  archetypes: string[];
  parts: string[];
  itemProperties: string[];
}

/**
 * Resolve every catalog/library id the character document actually references.
 * Does not invent ids from the owner's other library rows.
 */
export function collectCharacterViewRefIds(characterData: unknown): CharacterViewRefIds {
  const library = collectCharacterLibraryRefIds(characterData);
  const data = (characterData ?? {}) as Record<string, unknown>;
  const ancestry = (data.ancestry ?? {}) as Record<string, unknown>;
  const equipment = (data.equipment ?? {}) as Record<string, unknown>;

  const feats = new Set<string>();
  collectRefIds(data.feats, feats);
  collectRefIds(data.archetypeFeats, feats);

  const skills = new Set<string>();
  collectSkillIds(data.skills, skills);
  collectRefIds(ancestry.selectedSpeciesSkillIds, skills);

  const species = new Set<string>();
  collectRefIds(ancestry.id, species);
  collectRefIds(ancestry.speciesIds, species);
  collectRefIds(ancestry.selectedFlawSpeciesId, species);

  const traits = new Set<string>();
  collectRefIds(ancestry.selectedTraits, traits);
  collectRefIds(ancestry.selectedFlaw, traits);
  collectRefIds(ancestry.selectedCharacteristic, traits);
  collectRefIds(ancestry.selectedSpeciesTraits, traits);
  if (
    ancestry.selectedSpeciesTraitChoices &&
    typeof ancestry.selectedSpeciesTraitChoices === 'object'
  ) {
    for (const [parentId, optionId] of Object.entries(
      ancestry.selectedSpeciesTraitChoices as Record<string, unknown>,
    )) {
      collectRefIds(parentId, traits);
      collectRefIds(optionId, traits);
    }
  }

  const archetypes = new Set<string>();
  const lookupId = getArchetypeCodexLookupId({
    archetypePathId: typeof data.archetypePathId === 'string' ? data.archetypePathId : undefined,
    archetype: data.archetype as Character['archetype'],
  });
  if (lookupId) archetypes.add(lookupId);

  const parts = new Set<string>();
  const itemProperties = new Set<string>();
  collectRefIds(
    (data.powers as Array<{ parts?: unknown }> | undefined)?.flatMap((p) =>
      p && typeof p === 'object' ? p.parts : [],
    ),
    parts,
  );
  collectRefIds(
    (data.techniques as Array<{ parts?: unknown }> | undefined)?.flatMap((p) =>
      p && typeof p === 'object' ? p.parts : [],
    ),
    parts,
  );
  for (const key of EQUIPMENT_KEYS) {
    const slot = equipment[key];
    if (Array.isArray(slot)) {
      for (const item of slot) {
        if (item && typeof item === 'object') {
          collectRefIds((item as { properties?: unknown }).properties, itemProperties);
        }
      }
    } else if (slot && typeof slot === 'object') {
      collectRefIds((slot as { properties?: unknown }).properties, itemProperties);
    }
  }
  collectProficiencyIds(data.proficiencies, parts, itemProperties);

  return {
    ...library,
    feats: [...feats],
    skills: [...skills],
    species: [...species],
    traits: [...traits],
    archetypes: [...archetypes],
    parts: [...parts],
    itemProperties: [...itemProperties],
  };
}

/** Additive GET payload for RM / other-user sheet views (ADR-0015). */
export interface CharacterViewEnrichment {
  feats: CodexFeat[];
  skills: CodexSkill[];
  species: CodexSpecies[];
  traits: CodexTrait[];
  archetypes: Archetype[];
  equipment: CodexEquipmentItem[];
  powerParts: CodexPowerPart[];
  techniqueParts: CodexTechniquePart[];
  itemProperties: CodexItemProperty[];
  officialPowers: LibraryPower[];
  officialTechniques: LibraryTechnique[];
  officialItems: LibraryItem[];
  empoweredTechniques: LibraryTechnique[];
}

/** Extra ids stored on library / species rows that the character document only references by parent id. */
export function collectNestedIdsFromLibraryRows(rows: unknown[]): {
  parts: string[];
  itemProperties: string[];
  traits: string[];
  skills: string[];
} {
  const parts = new Set<string>();
  const itemProperties = new Set<string>();
  const traits = new Set<string>();
  const skills = new Set<string>();

  for (const entry of rows) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    collectRefIds(row.parts, parts);
    collectRefIds(row.techniqueParts, parts);
    collectRefIds(row.properties, itemProperties);
    collectRefIds(row.species_traits, traits);
    collectRefIds(row.ancestry_traits, traits);
    collectRefIds(row.flaws, traits);
    collectRefIds(row.characteristics, traits);
    collectRefIds(row.skills, skills);
    const power = row.power as Record<string, unknown> | undefined;
    if (power) {
      collectRefIds(power.parts, parts);
      collectRefIds(power.mechanics, parts);
      collectRefIds(power.autoMechanics, parts);
    }
    const technique = row.technique as Record<string, unknown> | undefined;
    if (technique) {
      collectRefIds(technique.parts, parts);
      collectRefIds(technique.autoMechanics, parts);
    }
  }

  return {
    parts: [...parts],
    itemProperties: [...itemProperties],
    traits: [...traits],
    skills: [...skills],
  };
}

export function emptyCharacterViewEnrichment(): CharacterViewEnrichment {
  return {
    feats: [],
    skills: [],
    species: [],
    traits: [],
    archetypes: [],
    equipment: [],
    powerParts: [],
    techniqueParts: [],
    itemProperties: [],
    officialPowers: [],
    officialTechniques: [],
    officialItems: [],
    empoweredTechniques: [],
  };
}

/** Map an enrichment payload onto the catalog args `useCharacterSheetDerived` already takes. */
export function sheetCatalogFromEnrichment(enrichment: CharacterViewEnrichment) {
  return {
    userPowers: [] as LibraryPower[],
    userTechniques: [] as LibraryTechnique[],
    userEmpoweredTechniques: enrichment.empoweredTechniques,
    userItems: [] as LibraryItem[],
    publicLibraries: {
      powers: enrichment.officialPowers,
      techniques: enrichment.officialTechniques,
      items: enrichment.officialItems,
    },
    codexEquipment: enrichment.equipment,
    powerPartsDb: enrichment.powerParts,
    techniquePartsDb: enrichment.techniqueParts,
    itemPropertiesDb: enrichment.itemProperties,
    allSpecies: enrichment.species,
    traitsDb: enrichment.traits,
    codexSkills: enrichment.skills,
    codexArchetypes: enrichment.archetypes,
    featsDb: enrichment.feats,
  };
}
