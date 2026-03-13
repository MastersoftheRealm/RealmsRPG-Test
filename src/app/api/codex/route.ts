/**
 * Codex API — returns all game reference data from Supabase (public schema).
 * All codex tables (codex_feats, codex_skills, …) and core_rules live in public;
 * columnar tables (see src/docs/SUPABASE_SCHEMA.md).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function toStrArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function toNumArray(val: unknown): number[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number);
  if (typeof val === 'number') return [val];
  if (typeof val === 'string') return val.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n));
  return [];
}

function toNum(val: unknown): number | undefined {
  if (val == null) return undefined;
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
}

function parseJsonObject(val: unknown): Record<string, unknown> | undefined {
  if (!val) return undefined;
  if (typeof val === 'object' && val !== null) return val as Record<string, unknown>;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/** DB row shape (snake_case from Supabase) */
type Row = Record<string, unknown>;

async function fetchCodexFromClient(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [
    { data: feats, error: eFeats },
    { data: skills, error: eSkills },
    { data: species, error: eSpecies },
    { data: traits, error: eTraits },
    { data: parts, error: eParts },
    { data: properties, error: eProps },
    { data: equipment, error: eEquip },
    { data: archetypes, error: eArch },
    { data: archetypeLevels, error: eArchLevels },
    { data: creatureFeats, error: eCreature },
    coreResult,
  ] = await Promise.all([
    supabase.from('codex_feats').select('*'),
    supabase.from('codex_skills').select('*'),
    supabase.from('codex_species').select('*'),
    supabase.from('codex_traits').select('*'),
    supabase.from('codex_parts').select('*'),
    supabase.from('codex_properties').select('*'),
    supabase.from('codex_equipment').select('*'),
    supabase.from('codex_archetypes').select('*'),
    supabase.from('codex_archetype_levels').select('*'),
    supabase.from('codex_creature_feats').select('*'),
    (async () => {
      const r = await supabase.from('core_rules').select('id, data');
      return r.error ? { data: [] as Row[], error: null } : r;
    })(),
  ]);

  const coreRulesRows = (coreResult as { data?: Row[] }).data ?? [];

  /** If table is missing (e.g. codex_* still in codex schema), treat as empty instead of 500. Run sql/path-c-phase0-consolidate-to-public-part1c.sql to move codex_* to public. */
  function isTableMissing(e: { message?: string; code?: string } | null): boolean {
    if (!e) return false;
    return e.code === '42P01' || /does not exist|relation.*not found/i.test(e.message ?? '');
  }

  const tableNames = ['codex_feats', 'codex_skills', 'codex_species', 'codex_traits', 'codex_parts', 'codex_properties', 'codex_equipment', 'codex_archetypes', 'codex_archetype_levels', 'codex_creature_feats'];
  const errors = [eFeats, eSkills, eSpecies, eTraits, eParts, eProps, eEquip, eArch, eArchLevels, eCreature];
  errors.forEach((e, i) => {
    if (e && isTableMissing(e)) {
      console.warn('[Codex API] Table missing (use empty):', tableNames[i], e.message);
    }
  });
  const firstRealError = errors.find((e) => e && !isTableMissing(e)) as { message?: string; code?: string } | undefined;
  if (firstRealError) {
    const err = new Error(firstRealError.message ?? 'Codex fetch failed') as Error & { code?: string };
    err.code = firstRealError.code;
    throw err;
  }

  const featRows = ((isTableMissing(eFeats) ? [] : feats) ?? []) as Row[];
    const skillRows = ((isTableMissing(eSkills) ? [] : skills) ?? []) as Row[];
    const speciesRows = ((isTableMissing(eSpecies) ? [] : species) ?? []) as Row[];
    const traitRows = ((isTableMissing(eTraits) ? [] : traits) ?? []) as Row[];
    const partRows = ((isTableMissing(eParts) ? [] : parts) ?? []) as Row[];
    const propRows = ((isTableMissing(eProps) ? [] : properties) ?? []) as Row[];
    const equipRows = ((isTableMissing(eEquip) ? [] : equipment) ?? []) as Row[];
    const archRows = ((isTableMissing(eArch) ? [] : archetypes) ?? []) as Row[];
    const archLevelRows = ((isTableMissing(eArchLevels) ? [] : archetypeLevels) ?? []) as Row[];
    const creatureRows = ((isTableMissing(eCreature) ? [] : creatureFeats) ?? []) as Row[];
    const coreRows = coreRulesRows as Row[];

    const codexFeats = featRows.map((r) => ({
      id: r.id,
      name: r.name ?? '',
      description: r.description ?? '',
      category: r.category ?? '',
      ability: r.ability ?? undefined,
      ability_req: toStrArray(r.ability_req),
      abil_req_val: toNumArray(r.abil_req_val),
      tags: toStrArray(r.tags),
      skill_req: toStrArray(r.skill_req),
      skill_req_val: toNumArray(r.skill_req_val),
      lvl_req: toNum(r.lvl_req),
      uses_per_rec: toNum(r.uses_per_rec),
      mart_abil_req: toNum(r.mart_abil_req),
      char_feat: Boolean(r.char_feat),
      state_feat: Boolean(r.state_feat),
      rec_period: r.rec_period ?? undefined,
      req_desc: r.req_desc ?? undefined,
      feat_cat_req: r.feat_cat_req ?? undefined,
      pow_abil_req: toNum(r.pow_abil_req),
      pow_prof_req: toNum(r.pow_prof_req),
      speed_req: toNum(r.speed_req),
      feat_lvl: toNum(r.feat_lvl),
      base_feat_id: r.base_feat_id != null && r.base_feat_id !== '' ? String(r.base_feat_id) : undefined,
    }));

    const codexSkills = skillRows.map((r) => {
      const ability = (r.ability ?? '') as string;
      const baseSkillId =
        r.base_skill !== undefined && r.base_skill !== null && r.base_skill !== ''
          ? parseInt(String(r.base_skill), 10)
          : undefined;
      return {
        id: r.id,
        name: r.name ?? '',
        description: r.description ?? '',
        ability,
        base_skill_id: !Number.isNaN(baseSkillId as number) ? baseSkillId : undefined,
        success_desc: r.success_desc ?? undefined,
        failure_desc: r.failure_desc ?? undefined,
        ds_calc: r.ds_calc ?? undefined,
        craft_success_desc: r.craft_success_desc ?? undefined,
        craft_failure_desc: r.craft_failure_desc ?? undefined,
      };
    });

    const speciesArr = (primary: unknown, ...fallbacks: unknown[]): string[] => {
      for (const v of [primary, ...fallbacks]) {
        const arr = toStrArray(v);
        if (arr.length > 0) return arr;
      }
      return [];
    };

    const toAdulthoodLifespan = (val: unknown): number[] | undefined => {
      if (val == null) return undefined;
      if (typeof val === 'string') {
        const arr = toNumArray(val);
        return arr.length ? arr : undefined;
      }
      if (Array.isArray(val)) return val.length ? (val as number[]) : undefined;
      if (typeof val === 'number' && !Number.isNaN(val)) return [val, val];
      return undefined;
    };

    const codexSpecies = speciesRows.map((r) => {
      const sizes: string[] = toStrArray(r.sizes);
      const aveHeight = r.ave_hgt_cm != null ? toNum(r.ave_hgt_cm) : undefined;
      const aveWeight = r.ave_wgt_kg != null ? toNum(r.ave_wgt_kg) : undefined;
      return {
        id: r.id,
        name: r.name ?? '',
        description: r.description ?? '',
        type: r.type ?? '',
        size: sizes[0] || 'Medium',
        sizes,
        speed: 6,
        traits: speciesArr(r.species_traits),
        species_traits: speciesArr(r.species_traits),
        ancestry_traits: speciesArr(r.ancestry_traits),
        flaws: speciesArr(r.flaws),
        characteristics: speciesArr(r.characteristics),
        skills: speciesArr(r.skills),
        languages: toStrArray(r.languages),
        ability_bonuses: undefined,
        ave_height: aveHeight,
        ave_weight: aveWeight,
        adulthood_lifespan: toAdulthoodLifespan(r.adulthood_lifespan),
      };
    });

    const codexTraits = traitRows.map((r) => ({
      id: r.id,
      name: r.name ?? '',
      description: r.description ?? '',
      species: [] as string[],
      uses_per_rec: toNum(r.uses_per_rec),
      rec_period: r.rec_period ?? undefined,
      flaw: r.flaw === true,
      characteristic: r.characteristic === true,
      option_trait_ids: toStrArray(r.option_trait_ids),
    }));

    const allParts = partRows.map((r) => {
      const type = ((r.type ?? 'power') as string).toLowerCase() as 'power' | 'technique';
      return {
        id: r.id,
        name: r.name ?? '',
        description: r.description ?? '',
        category: r.category ?? '',
        type,
        base_en: toNum(r.base_en),
        base_tp: toNum(r.base_tp),
        op_1_desc: r.op_1_desc ?? undefined,
        op_1_en: toNum(r.op_1_en),
        op_1_tp: toNum(r.op_1_tp),
        op_2_desc: r.op_2_desc ?? undefined,
        op_2_en: toNum(r.op_2_en),
        op_2_tp: toNum(r.op_2_tp),
        op_3_desc: r.op_3_desc ?? undefined,
        op_3_en: toNum(r.op_3_en),
        op_3_tp: toNum(r.op_3_tp),
        percentage: r.percentage === true,
        mechanic: r.mechanic === true,
        duration: r.duration === true,
        base_stam: 0,
        defense: toStrArray(r.defense),
      };
    });

    const codexPowerParts = allParts.filter((p) => (p.type || 'power').toLowerCase() === 'power');
    const codexTechniqueParts = allParts.filter((p) => (p.type || 'technique').toLowerCase() === 'technique');

    const codexProperties = propRows.map((r) => ({
      id: r.id,
      name: r.name ?? '',
      description: r.description ?? '',
      type: r.type ?? undefined,
      tp_cost: 0,
      gold_cost: 0,
      base_ip: toNum(r.base_ip),
      base_tp: toNum(r.base_tp),
      base_c: toNum(r.base_c),
      op_1_desc: r.op_1_desc ?? undefined,
      op_1_ip: toNum(r.op_1_ip),
      op_1_tp: toNum(r.op_1_tp),
      op_1_c: toNum(r.op_1_c),
      mechanic: r.mechanic === true,
    }));

    const codexEquipment = equipRows.map((r) => {
      const cost = toNum(r.currency) ?? 0;
      return {
        id: r.id,
        name: r.name ?? '',
        type: 'equipment' as const,
        subtype: undefined,
        category: r.category ?? undefined,
        description: r.description ?? '',
        damage: undefined,
        armor_value: undefined,
        gold_cost: cost,
        currency: cost,
        properties: [] as string[],
        rarity: r.rarity ?? undefined,
        weight: undefined,
      };
    });

    const levelsByArchetype = new Map<string, Row[]>();
    archLevelRows.forEach((levelRow) => {
      const archetypeId = levelRow.archetype_id != null ? String(levelRow.archetype_id) : '';
      if (!archetypeId) return;
      const existing = levelsByArchetype.get(archetypeId) || [];
      existing.push(levelRow);
      levelsByArchetype.set(archetypeId, existing);
    });

    const codexArchetypes = archRows.map((r) => {
      const archetypeId = String(r.id ?? '');
      const levelRows = (levelsByArchetype.get(archetypeId) || [])
        .map((entry) => ({
          level: toNum(entry.level),
          feats: toStrArray(entry.feats),
          skills: toStrArray(entry.skills),
          powers: toStrArray(entry.powers),
          techniques: toStrArray(entry.techniques),
          armaments: toStrArray(entry.armaments),
          equipment: toStrArray(entry.equipment),
          removeFeats: toStrArray(entry.remove_feats),
          removePowers: toStrArray(entry.remove_powers),
          removeTechniques: toStrArray(entry.remove_techniques),
          removeArmaments: toStrArray(entry.remove_armaments),
          notes: entry.notes ? String(entry.notes) : undefined,
        }))
        .filter((entry) => typeof entry.level === 'number')
        .sort((a, b) => Number(a.level) - Number(b.level));

      const level1FromColumns = {
        feats: toStrArray(r.level1_feats),
        skills: toStrArray(r.level1_skills),
        powers: toStrArray(r.level1_powers),
        techniques: toStrArray(r.level1_techniques),
        armaments: toStrArray(r.level1_armaments),
        equipment: toStrArray(r.level1_equipment),
        removeFeats: toStrArray(r.level1_remove_feats),
        removePowers: toStrArray(r.level1_remove_powers),
        removeTechniques: toStrArray(r.level1_remove_techniques),
        removeArmaments: toStrArray(r.level1_remove_armaments),
        notes: r.level1_notes ? String(r.level1_notes) : undefined,
      };
      const hasLevel1Columns = Object.values(level1FromColumns).some((value) => {
        if (Array.isArray(value)) return value.length > 0;
        return Boolean(value);
      });

      const legacyPath = parseJsonObject(r.path_data);
      const level1FromLegacy =
        legacyPath && typeof legacyPath.level1 === 'object' && legacyPath.level1 !== null
          ? (legacyPath.level1 as Record<string, unknown>)
          : undefined;

      return {
        id: r.id,
        name: r.name ?? '',
        type: r.type ?? '',
        description: r.description ?? '',
        archetype_ability: (r.archetype_ability as string | undefined) ?? undefined,
        secondary_ability: (r.secondary_ability as string | undefined) ?? undefined,
        power_prof_start: toNum(r.power_prof_start),
        martial_prof_start: toNum(r.martial_prof_start),
        power_prof_level5: toNum(r.power_prof_level5),
        martial_prof_level5: toNum(r.martial_prof_level5),
        path_data:
          hasLevel1Columns || levelRows.length > 0
            ? {
                ...(hasLevel1Columns ? { level1: level1FromColumns } : {}),
                ...(levelRows.length > 0 ? { levels: levelRows } : {}),
              }
            : legacyPath,
        level1_feats: toStrArray(r.level1_feats),
        level1_skills: toStrArray(r.level1_skills),
        level1_powers: toStrArray(r.level1_powers),
        level1_techniques: toStrArray(r.level1_techniques),
        level1_armaments: toStrArray(r.level1_armaments),
        level1_equipment: toStrArray(r.level1_equipment),
        level1_remove_feats: toStrArray(r.level1_remove_feats),
        level1_remove_powers: toStrArray(r.level1_remove_powers),
        level1_remove_techniques: toStrArray(r.level1_remove_techniques),
        level1_remove_armaments: toStrArray(r.level1_remove_armaments),
        level1_notes: r.level1_notes ?? level1FromLegacy?.notes ?? '',
      };
    });

    const codexCreatureFeats = creatureRows.map((r) => {
      const pointsVal = toNum(r.feat_points);
      return {
        id: r.id,
        name: r.name ?? '',
        description: r.description ?? '',
        points: pointsVal,
        feat_points: pointsVal,
        feat_lvl: toNum(r.feat_lvl),
        lvl_req: toNum(r.lvl_req),
        mechanic: r.mechanic === true,
        tiers: undefined,
        prereqs: [] as string[],
      };
    });

  const coreRules: Record<string, unknown> = {};
  for (const row of coreRows) {
    const id = row.id as string;
    if (id != null) coreRules[id] = row.data;
  }

  return {
    feats: codexFeats,
    skills: codexSkills,
    species: codexSpecies,
    traits: codexTraits,
    powerParts: codexPowerParts,
    techniqueParts: codexTechniqueParts,
    parts: allParts,
    itemProperties: codexProperties,
    equipment: codexEquipment,
    archetypes: codexArchetypes,
    creatureFeats: codexCreatureFeats,
    coreRules,
  };
}

const cacheControl = 'public, max-age=300, s-maxage=600, stale-while-revalidate=300';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const debug = url.searchParams.get('debug') === '1';
  try {
    const supabase = await createClient();
    const body = await fetchCodexFromClient(supabase);
    return NextResponse.json(body, { headers: { 'Cache-Control': cacheControl } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    const code = err && typeof err === 'object' && 'code' in err ? String((err as { code?: string }).code) : undefined;
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[Codex API] Database error:', message, stack);
    const safeHint =
      process.env.NODE_ENV === 'development'
        ? message
        : message.includes('connect') || message.includes('connection')
          ? 'Database connection failed. Check NEXT_PUBLIC_SUPABASE_URL and keys in Vercel.'
          : message.includes('exist') || message.includes('relation')
            ? 'Codex tables may be missing in public. Run Supabase SQL migrations.'
            : message.includes('permission') || message.includes('policy') || message.includes('row-level') || message.includes('denied')
              ? 'Permission denied: RLS may be blocking reads. Run sql/supabase-codex-rls-public.sql in Supabase Dashboard → SQL Editor.'
              : undefined;
    return NextResponse.json(
      {
        error: 'Failed to load codex',
        ...(safeHint && { hint: safeHint }),
        ...(debug && { debug: { message, code } }),
      },
      { status: 500 }
    );
  }
}
