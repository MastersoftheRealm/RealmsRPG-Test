/**
 * Codex API — returns all game reference data (from columnar codex tables)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
  const obj = val as { toNumber?: () => number };
  if (typeof obj?.toNumber === 'function') return obj.toNumber();
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
}

export async function GET() {
  try {
    const [feats, skills, species, traits, parts, properties, equipment, archetypes, creatureFeats, coreRulesRows] = await Promise.all([
      prisma.codexFeat.findMany(),
      prisma.codexSkill.findMany(),
      prisma.codexSpecies.findMany(),
      prisma.codexTrait.findMany(),
      prisma.codexPart.findMany(),
      prisma.codexProperty.findMany(),
      prisma.codexEquipment.findMany(),
      prisma.codexArchetype.findMany(),
      prisma.codexCreatureFeat.findMany(),
      prisma.coreRules.findMany().catch(() => []),
    ]);

    const codexFeats = feats.map((r) => ({
      id: r.id,
      name: r.name ?? '',
      description: r.description ?? '',
      category: r.category ?? '',
      ability: r.ability ?? undefined,
      ability_req: toStrArray(r.abilityReq),
      abil_req_val: toNumArray(r.abilReqVal),
      tags: toStrArray(r.tags),
      skill_req: toStrArray(r.skillReq),
      skill_req_val: toNumArray(r.skillReqVal),
      lvl_req: toNum(r.lvlReq) ?? 0,
      uses_per_rec: toNum(r.usesPerRec) ?? 0,
      mart_abil_req: toNum(r.martAbilReq),
      char_feat: Boolean(r.charFeat),
      state_feat: Boolean(r.stateFeat),
      rec_period: r.recPeriod ?? undefined,
      req_desc: r.reqDesc ?? undefined,
      feat_cat_req: r.featCatReq ?? undefined,
      pow_abil_req: toNum(r.powAbilReq),
      pow_prof_req: toNum(r.powProfReq),
      speed_req: toNum(r.speedReq),
      feat_lvl: toNum(r.featLvl),
    }));

    const codexSkills = skills.map((r) => {
      const ability = r.ability ?? '';
      const baseSkillId =
        r.baseSkill !== undefined && r.baseSkill !== null && r.baseSkill !== ''
          ? parseInt(String(r.baseSkill), 10)
          : undefined;
      return {
        id: r.id,
        name: r.name ?? '',
        description: r.description ?? '',
        ability,
        base_skill_id: !Number.isNaN(baseSkillId as number) ? baseSkillId : undefined,
        success_desc: r.successDesc ?? undefined,
        failure_desc: r.failureDesc ?? undefined,
        ds_calc: r.dsCalc ?? undefined,
        craft_success_desc: r.craftSuccessDesc ?? undefined,
        craft_failure_desc: r.craftFailureDesc ?? undefined,
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

    const codexSpecies = species.map((r) => {
      const sizes: string[] = toStrArray(r.sizes);
      const aveHeight = r.aveHgtCm != null ? toNum(r.aveHgtCm) : undefined;
      const aveWeight = r.aveWgtKg != null ? toNum(r.aveWgtKg) : undefined;
      return {
        id: r.id,
        name: r.name ?? '',
        description: r.description ?? '',
        type: r.type ?? '',
        size: sizes[0] || 'Medium',
        sizes,
        speed: 6,
        traits: speciesArr(r.speciesTraits),
        species_traits: speciesArr(r.speciesTraits),
        ancestry_traits: speciesArr(r.ancestryTraits),
        flaws: speciesArr(r.flaws),
        characteristics: speciesArr(r.characteristics),
        skills: speciesArr(r.skills),
        languages: toStrArray(r.languages),
        ability_bonuses: undefined,
        ave_height: aveHeight,
        ave_weight: aveWeight,
        adulthood_lifespan: toAdulthoodLifespan(r.adulthoodLifespan),
      };
    });

    const codexTraits = traits.map((r) => ({
      id: r.id,
      name: r.name ?? '',
      description: r.description ?? '',
      species: [] as string[],
      uses_per_rec: toNum(r.usesPerRec),
      rec_period: r.recPeriod ?? undefined,
      flaw: r.flaw === true,
      characteristic: r.characteristic === true,
      option_trait_ids: toStrArray(r.optionTraitIds),
    }));

    const allParts = parts.map((r) => {
      const type = ((r.type ?? 'power').toLowerCase()) as 'power' | 'technique';
      return {
        id: r.id,
        name: r.name ?? '',
        description: r.description ?? '',
        category: r.category ?? '',
        type,
        base_en: toNum(r.baseEn) ?? 0,
        base_tp: toNum(r.baseTp) ?? 0,
        op_1_desc: r.op1Desc ?? undefined,
        op_1_en: toNum(r.op1En) ?? 0,
        op_1_tp: toNum(r.op1Tp) ?? 0,
        op_2_desc: r.op2Desc ?? undefined,
        op_2_en: toNum(r.op2En) ?? 0,
        op_2_tp: toNum(r.op2Tp) ?? 0,
        op_3_desc: r.op3Desc ?? undefined,
        op_3_en: toNum(r.op3En) ?? 0,
        op_3_tp: toNum(r.op3Tp) ?? 0,
        percentage: r.percentage === true,
        mechanic: r.mechanic === true,
        duration: r.duration === true,
        base_stam: 0,
        defense: toStrArray(r.defense),
      };
    });

    const codexPowerParts = allParts.filter((p) => (p.type || 'power').toLowerCase() === 'power');
    const codexTechniqueParts = allParts.filter((p) => (p.type || 'technique').toLowerCase() === 'technique');

    const codexProperties = properties.map((r) => ({
      id: r.id,
      name: r.name ?? '',
      description: r.description ?? '',
      type: r.type ?? undefined,
      tp_cost: 0,
      gold_cost: 0,
      base_ip: toNum(r.baseIp) ?? 0,
      base_tp: toNum(r.baseTp) ?? 0,
      base_c: toNum(r.baseC) ?? 0,
      op_1_desc: r.op1Desc ?? undefined,
      op_1_ip: toNum(r.op1Ip) ?? 0,
      op_1_tp: toNum(r.op1Tp) ?? 0,
      op_1_c: toNum(r.op1C) ?? 0,
      mechanic: r.mechanic === true,
    }));

    const codexEquipment = equipment.map((r) => {
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

    const codexArchetypes = archetypes.map((r) => ({
      id: r.id,
      name: r.name ?? '',
      type: r.type ?? '',
      description: r.description ?? '',
    }));

    const codexCreatureFeats = creatureFeats.map((r) => {
      const pointsVal = toNum(r.featPoints) ?? 0;
      return {
        id: r.id,
        name: r.name ?? '',
        description: r.description ?? '',
        points: pointsVal,
        feat_points: pointsVal,
        feat_lvl: toNum(r.featLvl),
        lvl_req: toNum(r.lvlReq),
        mechanic: r.mechanic === true,
        tiers: undefined,
        prereqs: [] as string[],
      };
    });

    const coreRules: Record<string, unknown> = {};
    for (const row of coreRulesRows) {
      coreRules[row.id] = row.data;
    }

    const cacheControl = 'public, max-age=300, s-maxage=600, stale-while-revalidate=300';
    return NextResponse.json(
      {
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
      },
      { headers: { 'Cache-Control': cacheControl } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[Codex API] Database error:', message, stack);
    const safeHint =
      process.env.NODE_ENV === 'development'
        ? message
        : message.includes('connect') || message.includes('connection')
          ? 'Database connection failed. Check DATABASE_URL and ?pgbouncer=true in Vercel env vars.'
          : message.includes('exist') || message.includes('relation')
            ? 'Codex tables may be missing. Run: npx prisma migrate deploy'
            : undefined;
    return NextResponse.json(
      { error: 'Failed to load codex', ...(safeHint && { hint: safeHint }) },
      { status: 500 }
    );
  }
}
