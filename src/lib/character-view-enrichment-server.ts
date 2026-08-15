/**
 * Server fetch for TASK-773 read-only view enrichment.
 *
 * Public tables use the request's RLS-backed client. Owner user_empowered /
 * user_species use the service-role client with the same referenced-id gate as
 * `getOwnerLibraryForView` (audit P0-1).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeFeatAbilities } from '@/lib/codex/feat-ability';
import {
  collectCharacterLibraryRefIds,
  collectCharacterViewRefIds,
  collectNestedIdsFromLibraryRows,
  emptyCharacterViewEnrichment,
  type CharacterViewEnrichment,
} from '@/lib/character-view-enrichment';
import { mapCodexBaseSkillToId } from '@/lib/game/character-legality';
import { fetchCodexArchetypeById } from '@/lib/game/archetype-display';
import { getOwnerLibraryForView, type LibraryForView } from '@/lib/owner-library-for-view';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { columnarViewSelect, rowToItem, rowToItemSpecies } from '@/lib/library-columnar';
import type { Archetype } from '@/types';
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

type Row = Record<string, unknown>;

function toStrArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function toNumArray(val: unknown): number[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number).filter((n) => !Number.isNaN(n));
  if (typeof val === 'number') return [val];
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !Number.isNaN(n));
  }
  return [];
}

function toNum(val: unknown): number | undefined {
  if (val == null) return undefined;
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
}

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

function mapFeat(r: Row): CodexFeat {
  const ability = normalizeFeatAbilities(r.ability as string | string[] | null | undefined);
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    description: String(r.description ?? ''),
    category: String(r.category ?? ''),
    ability: ability.length > 0 ? ability : undefined,
    ability_req: toStrArray(r.ability_req),
    abil_req_val: toNumArray(r.abil_req_val),
    tags: toStrArray(r.tags),
    skill_req: toStrArray(r.skill_req),
    skill_req_val: toNumArray(r.skill_req_val),
    lvl_req: toNum(r.lvl_req) ?? 0,
    uses_per_rec: toNum(r.uses_per_rec) ?? 0,
    mart_abil_req: toNum(r.mart_abil_req),
    char_feat: Boolean(r.char_feat),
    state_feat: Boolean(r.state_feat),
    rec_period: r.rec_period ? String(r.rec_period) : undefined,
    req_desc: r.req_desc ? String(r.req_desc) : undefined,
    feat_cat_req: r.feat_cat_req ? String(r.feat_cat_req) : undefined,
    pow_abil_req: toNum(r.pow_abil_req),
    pow_prof_req: toNum(r.pow_prof_req),
    mart_prof_req: toNum(r.mart_prof_req),
    speed_req: toNum(r.speed_req),
    feat_lvl: toNum(r.feat_lvl),
    base_feat_id:
      r.base_feat_id != null && r.base_feat_id !== '' ? String(r.base_feat_id) : undefined,
  };
}

function mapSkill(r: Row): CodexSkill {
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    description: String(r.description ?? ''),
    ability: String(r.ability ?? ''),
    base_skill_id: mapCodexBaseSkillToId(r.base_skill),
    success_desc: r.success_desc ? String(r.success_desc) : undefined,
    failure_desc: r.failure_desc ? String(r.failure_desc) : undefined,
  };
}

function mapSpecies(r: Row): CodexSpecies {
  const sizes = toStrArray(r.sizes);
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    description: String(r.description ?? ''),
    type: String(r.type ?? ''),
    size: sizes[0] || 'Medium',
    sizes,
    speed: 6,
    traits: toStrArray(r.species_traits),
    species_traits: toStrArray(r.species_traits),
    ancestry_traits: toStrArray(r.ancestry_traits),
    flaws: toStrArray(r.flaws),
    characteristics: toStrArray(r.characteristics),
    skills: toStrArray(r.skills),
    languages: toStrArray(r.languages),
    ave_height: r.ave_hgt_cm != null ? toNum(r.ave_hgt_cm) : undefined,
    ave_weight: r.ave_wgt_kg != null ? toNum(r.ave_wgt_kg) : undefined,
    image_url: typeof r.image_url === 'string' && r.image_url.trim() ? r.image_url.trim() : null,
    image_id: typeof r.image_id === 'string' && r.image_id.trim() ? r.image_id.trim() : null,
  };
}

function mapTrait(r: Row): CodexTrait {
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    description: String(r.description ?? ''),
    species: [],
    uses_per_rec: toNum(r.uses_per_rec),
    rec_period: r.rec_period ? String(r.rec_period) : undefined,
    flaw: r.flaw === true,
    characteristic: r.characteristic === true,
    option_trait_ids: toStrArray(r.option_trait_ids),
  };
}

function mapPart(r: Row): CodexPowerPart & { type: string } {
  const type = String(r.type ?? 'power').toLowerCase();
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    description: String(r.description ?? ''),
    category: String(r.category ?? ''),
    type,
    base_en: toNum(r.base_en) ?? 0,
    base_tp: toNum(r.base_tp) ?? 0,
    op_1_desc: r.op_1_desc ? String(r.op_1_desc) : undefined,
    op_1_en: toNum(r.op_1_en),
    op_1_tp: toNum(r.op_1_tp),
    op_2_desc: r.op_2_desc ? String(r.op_2_desc) : undefined,
    op_2_en: toNum(r.op_2_en),
    op_2_tp: toNum(r.op_2_tp),
    op_3_desc: r.op_3_desc ? String(r.op_3_desc) : undefined,
    op_3_en: toNum(r.op_3_en),
    op_3_tp: toNum(r.op_3_tp),
    percentage: r.percentage === true,
    mechanic: r.mechanic === true,
    duration: r.duration === true,
    defense: toStrArray(r.defense),
  };
}

function mapProperty(r: Row): CodexItemProperty {
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    description: String(r.description ?? ''),
    type: r.type as CodexItemProperty['type'],
    tp_cost: 0,
    gold_cost: 0,
    base_ip: toNum(r.base_ip),
    base_tp: toNum(r.base_tp),
    base_c: toNum(r.base_c),
    op_1_desc: r.op_1_desc ? String(r.op_1_desc) : undefined,
    op_1_ip: toNum(r.op_1_ip),
    op_1_tp: toNum(r.op_1_tp),
    op_1_c: toNum(r.op_1_c),
    mechanic: r.mechanic === true,
  };
}

function mapEquipment(r: Row): CodexEquipmentItem {
  const cost = toNum(r.currency) ?? 0;
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    type: 'equipment',
    description: String(r.description ?? ''),
    gold_cost: cost,
    currency: cost,
    properties: [],
    rarity: r.rarity ? String(r.rarity) : undefined,
    image_url: typeof r.image_url === 'string' && r.image_url.trim() ? r.image_url.trim() : null,
    image_id: typeof r.image_id === 'string' && r.image_id.trim() ? r.image_id.trim() : null,
  };
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

  const userSpecies = ownerSpeciesRows.map((row) => mapSpecies(rowToItemSpecies(row)));
  const codexSpecies = codexSpeciesRows.map(mapSpecies);
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

  const allParts = partRows.map(mapPart);

  return {
    ...empty,
    feats: featRows.map(mapFeat),
    skills: skillRows.map(mapSkill),
    species,
    traits: traitRows.map(mapTrait),
    archetypes,
    equipment: equipmentRows.map(mapEquipment),
    powerParts: allParts.filter((p) => (p.type || 'power') === 'power'),
    techniqueParts: allParts.filter((p) => p.type === 'technique') as CodexTechniquePart[],
    itemProperties: propertyRows.map(mapProperty),
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
