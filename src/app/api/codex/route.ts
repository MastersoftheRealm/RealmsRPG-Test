/**
 * Codex API — returns all game reference data
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

export async function GET() {
  try {
    const [feats, skills, species, traits, parts, properties, equipment, archetypes, creatureFeats] = await Promise.all([
    prisma.codexFeat.findMany(),
    prisma.codexSkill.findMany(),
    prisma.codexSpecies.findMany(),
    prisma.codexTrait.findMany(),
    prisma.codexPart.findMany(),
    prisma.codexProperty.findMany(),
    prisma.codexEquipment.findMany(),
    prisma.codexArchetype.findMany(),
    prisma.codexCreatureFeat.findMany(),
  ]);

  const codexFeats = feats.map((r) => {
    const d = r.data as Record<string, unknown>;
    return {
      id: r.id,
      name: (d.name as string) || '',
      description: (d.description as string) || '',
      category: (d.category as string) || '',
      ability: d.ability as string | undefined,
      ability_req: toStrArray(d.ability_req),
      abil_req_val: toNumArray(d.abil_req_val),
      tags: toStrArray(d.tags),
      skill_req: toStrArray(d.skill_req),
      skill_req_val: toNumArray(d.skill_req_val),
      lvl_req: parseInt(d.lvl_req as string) || 0,
      uses_per_rec: parseInt(d.uses_per_rec as string) || 0,
      mart_abil_req: d.mart_abil_req as string | undefined,
      char_feat: Boolean(d.char_feat),
      state_feat: Boolean(d.state_feat),
      rec_period: d.rec_period as string | undefined,
      prereq_text: d.prereq_text as string | undefined,
    };
  });

  const codexSkills = skills.map((r) => {
    const d = r.data as Record<string, unknown>;
    let ability = '';
    if (Array.isArray(d.ability)) ability = (d.ability as string[]).join(', ');
    else if (typeof d.ability === 'string') ability = d.ability;
    const baseSkillId =
      typeof d.base_skill_id === 'number'
        ? d.base_skill_id
        : typeof d.base_skill_id === 'string' && d.base_skill_id !== ''
          ? parseInt(d.base_skill_id as string, 10)
          : undefined;
    return {
      id: r.id,
      name: (d.name as string) || '',
      description: (d.description as string) || '',
      ability,
      category: (d.category as string) || '',
      base_skill_id: !isNaN(baseSkillId as number) ? baseSkillId : undefined,
      trained_only: d.trained_only === true || d.trained_only === 'true',
    };
  });

  const codexSpecies = species.map((r) => {
    const d = r.data as Record<string, unknown>;
    let sizes: string[] = [];
    if (typeof d.sizes === 'string') sizes = d.sizes.split(',').map((s: string) => s.trim());
    else if (Array.isArray(d.sizes)) sizes = d.sizes;
    return {
      id: r.id,
      name: (d.name as string) || '',
      description: (d.description as string) || '',
      type: (d.type as string) || '',
      size: sizes[0] || 'Medium',
      sizes,
      speed: parseInt(d.speed as string) || 6,
      traits: toStrArray(d.traits),
      species_traits: toStrArray(d.species_traits),
      ancestry_traits: toStrArray(d.ancestry_traits),
      flaws: toStrArray(d.flaws),
      characteristics: toStrArray(d.characteristics),
      skills: toStrArray(d.skills),
      languages: toStrArray(d.languages),
      ability_bonuses: d.ability_bonuses as Record<string, number> | undefined,
      ave_height: d.ave_height as number | undefined,
      ave_weight: d.ave_weight as number | undefined,
      adulthood_lifespan: d.adulthood_lifespan as number[] | undefined,
    };
  });

  const codexTraits = traits.map((r) => {
    const d = r.data as Record<string, unknown>;
    return {
      id: r.id,
      name: (d.name as string) || '',
      description: (d.description as string) || '',
      species: toStrArray(d.species),
      uses_per_rec: d.uses_per_rec as number | undefined,
      rec_period: d.rec_period as string | undefined,
    };
  });

  const allParts = parts.map((r) => {
    const d = r.data as Record<string, unknown>;
    const type = ((d.type as string)?.toLowerCase() || 'power') as 'power' | 'technique';
    return {
      id: r.id,
      name: (d.name as string) || '',
      description: (d.description as string) || '',
      category: (d.category as string) || '',
      type,
      base_en: parseFloat(d.base_en as string) || 0,
      base_tp: parseFloat(d.base_tp as string) || 0,
      op_1_desc: d.op_1_desc as string | undefined,
      op_1_en: parseFloat(d.op_1_en as string) || 0,
      op_1_tp: parseFloat(d.op_1_tp as string) || 0,
      op_2_desc: d.op_2_desc as string | undefined,
      op_2_en: parseFloat(d.op_2_en as string) || 0,
      op_2_tp: parseFloat(d.op_2_tp as string) || 0,
      op_3_desc: d.op_3_desc as string | undefined,
      op_3_en: parseFloat(d.op_3_en as string) || 0,
      op_3_tp: parseFloat(d.op_3_tp as string) || 0,
      percentage: d.percentage === true || d.percentage === 'true',
      mechanic: d.mechanic === true || d.mechanic === 'true',
      base_stam: parseFloat(d.base_stam as string) || 0,
    };
  });

  const codexPowerParts = allParts.filter((p) => (p.type || 'power').toLowerCase() === 'power');
  const codexTechniqueParts = allParts.filter((p) => (p.type || 'technique').toLowerCase() === 'technique');

  const codexProperties = properties.map((r) => {
    const d = r.data as Record<string, unknown>;
    return {
      id: r.id,
      name: (d.name as string) || '',
      description: (d.description as string) || '',
      type: ((d.type as string) || 'general') as 'weapon' | 'armor' | 'shield' | 'general',
      tp_cost: parseFloat(d.tp_cost as string) || 0,
      gold_cost: parseFloat(d.gold_cost as string) || 0,
      base_ip: parseFloat(d.base_ip as string) || 0,
      base_tp: parseFloat(d.base_tp as string) || 0,
      base_c: parseFloat(d.base_c as string) || 0,
      op_1_desc: d.op_1_desc as string | undefined,
      op_1_ip: parseFloat(d.op_1_ip as string) || 0,
      op_1_tp: parseFloat(d.op_1_tp as string) || 0,
      op_1_c: parseFloat(d.op_1_c as string) || 0,
    };
  });

  const codexEquipment = equipment.map((r) => {
    const d = r.data as Record<string, unknown>;
    return {
      id: r.id,
      name: (d.name as string) || '',
      type: ((d.type as string) || 'equipment') as 'weapon' | 'armor' | 'equipment',
      subtype: d.subtype as string | undefined,
      category: d.category as string | undefined,
      description: (d.description as string) || '',
      damage: d.damage as string | undefined,
      armor_value: d.armor_value != null ? parseInt(d.armor_value as string) : undefined,
      gold_cost: parseFloat(d.gold_cost as string) || 0,
      currency: parseFloat(d.currency as string) || parseFloat(d.gold_cost as string) || 0,
      properties: toStrArray(d.properties),
      rarity: d.rarity as string | undefined,
      weight: d.weight != null ? parseFloat(d.weight as string) : undefined,
    };
  });

  const codexArchetypes = archetypes.map((r) => ({ id: r.id, ...(r.data as Record<string, unknown>) }));

  const codexCreatureFeats = creatureFeats.map((r) => {
    const d = r.data as Record<string, unknown>;
    return {
      id: r.id,
      name: (d.name as string) || '',
      description: (d.description as string) || '',
      points: Number(d.points ?? d.feat_points ?? d.cost ?? 0),
      tiers: d.tiers ? Number(d.tiers) : undefined,
      prereqs: toStrArray(d.prereqs),
    };
  });

  return NextResponse.json({
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
  });
  } catch (err) {
    console.error('[Codex API] Database error:', err);
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return NextResponse.json(
      { error: 'Failed to load codex', details: process.env.NODE_ENV === 'development' ? message : undefined },
      { status: 500 }
    );
  }
}
