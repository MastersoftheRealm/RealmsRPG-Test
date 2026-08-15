/**
 * Server fetch for TASK-773 read-only view enrichment.
 *
 * Public tables use the request's RLS-backed client. Owner user_empowered /
 * user_species use the service-role client with the same referenced-id gate as
 * `getOwnerLibraryForView` (audit P0-1).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  collectCharacterLibraryRefIds,
  collectCharacterViewRefIds,
  collectNestedIdsFromLibraryRows,
  emptyCharacterViewEnrichment,
  type CharacterViewEnrichment,
} from '@/lib/character-view-enrichment';
import { selectPowerParts, selectTechniqueParts } from '@/lib/codex/part-type';
import {
  mapCodexEquipment,
  mapCodexFeat,
  mapCodexPart,
  mapCodexProperty,
  mapCodexSkill,
  mapCodexSpecies,
  mapCodexTrait,
} from '@/lib/codex/row-map';
import { fetchCodexArchetypeById } from '@/lib/game/archetype-display';
import { getOwnerLibraryForView, type LibraryForView } from '@/lib/owner-library-for-view';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { columnarViewSelect, rowToItem, rowToItemSpecies } from '@/lib/library-columnar';
import type { Archetype } from '@/types';
import type { LibraryItem, LibraryPower, LibraryTechnique } from '@/types/library';

type Row = Record<string, unknown>;

async function fetchByIds(
  client: SupabaseClient,
  table: string,
  ids: string[],
  columns = '*',
): Promise<Row[]> {
  if (ids.length === 0) return [];
  const { data, error } = await client.from(table).select(columns).in('id', ids);
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

async function fetchOwnerByIds(
  client: ReturnType<typeof createServiceRoleClient>,
  table: string,
  ownerUserId: string,
  ids: string[],
  columns: string,
): Promise<Row[]> {
  if (ids.length === 0) return [];
  const { data, error } = await client
    .from(table)
    .select(columns)
    .eq('user_id', ownerUserId)
    .in('id', ids);
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

function mergeUniqueById<T extends { id?: string | number }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const id = row.id != null ? String(row.id) : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(row);
  }
  return out;
}

/**
 * Fetch referenced catalog + official + owner empowered/species rows for a read-only view.
 */
export async function getCharacterViewEnrichment(
  publicClient: SupabaseClient,
  ownerUserId: string,
  characterData: unknown,
  libraryForView: LibraryForView,
): Promise<CharacterViewEnrichment> {
  const refs = collectCharacterViewRefIds(characterData);
  const empty = emptyCharacterViewEnrichment();

  const needsOwnerTables = refs.techniques.length > 0 || refs.species.length > 0;
  const ownerClient = needsOwnerTables ? createServiceRoleClient() : null;

  const [
    officialPowersRows,
    officialTechniquesRows,
    officialEmpoweredRows,
    officialItemRows,
    ownerEmpoweredRows,
    ownerSpeciesRows,
    codexSpeciesRows,
  ] = await Promise.all([
    fetchByIds(publicClient, 'official_powers', refs.powers, columnarViewSelect('powers')),
    fetchByIds(
      publicClient,
      'official_techniques',
      refs.techniques,
      columnarViewSelect('techniques'),
    ),
    fetchByIds(
      publicClient,
      'official_empowered_techniques',
      refs.techniques,
      columnarViewSelect('empowered-techniques'),
    ),
    fetchByIds(publicClient, 'official_items', refs.items, columnarViewSelect('items')),
    ownerClient
      ? fetchOwnerByIds(
          ownerClient,
          'user_empowered_techniques',
          ownerUserId,
          refs.techniques,
          columnarViewSelect('empowered-techniques'),
        )
      : Promise.resolve([]),
    ownerClient
      ? fetchOwnerByIds(ownerClient, 'user_species', ownerUserId, refs.species, '*')
      : Promise.resolve([]),
    fetchByIds(publicClient, 'codex_species', refs.species),
  ]);

  const officialPowers = officialPowersRows.map((row) =>
    rowToItem('powers', row, 'official'),
  ) as unknown as LibraryPower[];
  const officialTechniques = [
    ...officialTechniquesRows.map((row) => rowToItem('techniques', row, 'official')),
    ...officialEmpoweredRows.map((row) => rowToItem('empowered-techniques', row, 'official')),
  ] as unknown as LibraryTechnique[];
  const officialItems = officialItemRows.map((row) =>
    rowToItem('items', row, 'official'),
  ) as unknown as LibraryItem[];
  const empoweredTechniques = ownerEmpoweredRows.map((row) =>
    rowToItem('empowered-techniques', row, 'user'),
  ) as unknown as LibraryTechnique[];

  const userSpecies = ownerSpeciesRows.map((row) => mapCodexSpecies(rowToItemSpecies(row)));
  const codexSpecies = codexSpeciesRows.map(mapCodexSpecies);
  const species = mergeUniqueById([...userSpecies, ...codexSpecies]);

  const nested = collectNestedIdsFromLibraryRows([
    ...libraryForView.powers,
    ...libraryForView.techniques,
    ...libraryForView.items,
    ...officialPowers,
    ...officialTechniques,
    ...officialItems,
    ...empoweredTechniques,
    ...species,
  ]);

  const featIds = [...new Set(refs.feats)];
  const skillIds = [...new Set([...refs.skills, ...nested.skills])];
  const traitIds = [...new Set([...refs.traits, ...nested.traits])];
  const partIds = [...new Set([...refs.parts, ...nested.parts])];
  const propertyIds = [...new Set([...refs.itemProperties, ...nested.itemProperties])];

  const [featRows, skillRows, traitRows, partRows, propertyRows, equipmentRows, archetypes] =
    await Promise.all([
      fetchByIds(publicClient, 'codex_feats', featIds),
      fetchByIds(publicClient, 'codex_skills', skillIds),
      fetchByIds(publicClient, 'codex_traits', traitIds),
      fetchByIds(publicClient, 'codex_parts', partIds),
      fetchByIds(publicClient, 'codex_properties', propertyIds),
      fetchByIds(publicClient, 'codex_equipment', refs.items),
      Promise.all(refs.archetypes.map((id) => fetchCodexArchetypeById(publicClient, id))).then(
        (rows) => rows.filter((row): row is Archetype => row != null),
      ),
    ]);

  const allParts = partRows.map(mapCodexPart);

  return {
    ...empty,
    feats: featRows.map(mapCodexFeat),
    skills: skillRows.map(mapCodexSkill),
    species,
    traits: traitRows.map(mapCodexTrait),
    archetypes,
    equipment: equipmentRows.map(mapCodexEquipment),
    powerParts: selectPowerParts(allParts),
    techniqueParts: selectTechniqueParts(allParts),
    itemProperties: propertyRows.map(mapCodexProperty),
    officialPowers,
    officialTechniques,
    officialItems,
    empoweredTechniques,
  };
}

/** Owner library + referenced enrichment for a verified other-user / RM view. */
export async function getOwnerLibraryAndEnrichmentForView(
  publicClient: SupabaseClient,
  ownerUserId: string,
  characterData: unknown,
): Promise<{ libraryForView: LibraryForView; enrichment: CharacterViewEnrichment }> {
  const libraryForView = await getOwnerLibraryForView(
    ownerUserId,
    collectCharacterLibraryRefIds(characterData),
  );
  const enrichment = await getCharacterViewEnrichment(
    publicClient,
    ownerUserId,
    characterData,
    libraryForView,
  );
  return { libraryForView, enrichment };
}
