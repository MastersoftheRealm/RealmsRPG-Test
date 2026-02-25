/**
 * Codex Data (Prisma) — columnar tables
 * Server-side codex fetchers. Use in Server Components or API routes.
 * Returns same shape as API codex payload (id -> record) for compatibility.
 */

import { prisma } from '@/lib/prisma';
import type { CodexFeat, CodexSkill, CodexSpecies, CodexTrait, CodexPart, CodexProperty, CodexEquipment, CodexArchetype, CodexCreatureFeat } from '@prisma/client';

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

function featToRecord(r: CodexFeat): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    req_desc: r.reqDesc ?? undefined,
    ability_req: toStrArray(r.abilityReq),
    abil_req_val: toNumArray(r.abilReqVal),
    skill_req: toStrArray(r.skillReq),
    skill_req_val: toNumArray(r.skillReqVal),
    feat_cat_req: r.featCatReq ?? undefined,
    pow_abil_req: toNum(r.powAbilReq),
    mart_abil_req: toNum(r.martAbilReq),
    pow_prof_req: toNum(r.powProfReq),
    mart_prof_req: toNum(r.martProfReq),
    speed_req: toNum(r.speedReq),
    feat_lvl: toNum(r.featLvl),
    lvl_req: toNum(r.lvlReq),
    uses_per_rec: toNum(r.usesPerRec),
    rec_period: r.recPeriod ?? undefined,
    category: r.category ?? undefined,
    ability: r.ability ?? undefined,
    tags: toStrArray(r.tags),
    char_feat: r.charFeat ?? false,
    state_feat: r.stateFeat ?? false,
  };
}

function skillToRecord(r: CodexSkill): Record<string, unknown> {
  const baseSkillId = r.baseSkill != null && r.baseSkill !== '' ? parseInt(String(r.baseSkill), 10) : undefined;
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    ability: r.ability ?? '',
    base_skill_id: baseSkillId != null && !Number.isNaN(baseSkillId) ? baseSkillId : undefined,
    success_desc: r.successDesc ?? undefined,
    failure_desc: r.failureDesc ?? undefined,
    ds_calc: r.dsCalc ?? undefined,
    craft_success_desc: r.craftSuccessDesc ?? undefined,
    craft_failure_desc: r.craftFailureDesc ?? undefined,
  };
}

function speciesToRecord(r: CodexSpecies): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    type: r.type ?? '',
    sizes: toStrArray(r.sizes),
    skills: toStrArray(r.skills),
    species_traits: toStrArray(r.speciesTraits),
    ancestry_traits: toStrArray(r.ancestryTraits),
    flaws: toStrArray(r.flaws),
    characteristics: toStrArray(r.characteristics),
    ave_hgt_cm: toNum(r.aveHgtCm),
    ave_wgt_kg: toNum(r.aveWgtKg),
    adulthood_lifespan: r.adulthoodLifespan ?? undefined,
    languages: toStrArray(r.languages),
  };
}

function traitToRecord(r: CodexTrait): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    uses_per_rec: toNum(r.usesPerRec),
    rec_period: r.recPeriod ?? undefined,
    flaw: r.flaw ?? false,
    characteristic: r.characteristic ?? false,
    option_trait_ids: toStrArray(r.optionTraitIds),
  };
}

function partToRecord(r: CodexPart): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    category: r.category ?? '',
    base_en: toNum(r.baseEn),
    base_tp: toNum(r.baseTp),
    op_1_desc: r.op1Desc ?? undefined,
    op_1_en: toNum(r.op1En),
    op_1_tp: toNum(r.op1Tp),
    op_2_desc: r.op2Desc ?? undefined,
    op_2_en: toNum(r.op2En),
    op_2_tp: toNum(r.op2Tp),
    op_3_desc: r.op3Desc ?? undefined,
    op_3_en: toNum(r.op3En),
    op_3_tp: toNum(r.op3Tp),
    type: (r.type ?? 'power').toLowerCase(),
    mechanic: r.mechanic ?? false,
    percentage: r.percentage ?? false,
    duration: r.duration ?? false,
    defense: toStrArray(r.defense),
  };
}

function propertyToRecord(r: CodexProperty): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    type: r.type ?? undefined,
    base_ip: toNum(r.baseIp),
    base_tp: toNum(r.baseTp),
    base_c: toNum(r.baseC),
    op_1_desc: r.op1Desc ?? undefined,
    op_1_ip: toNum(r.op1Ip),
    op_1_tp: toNum(r.op1Tp),
    op_1_c: toNum(r.op1C),
    mechanic: r.mechanic ?? false,
  };
}

function equipmentToRecord(r: CodexEquipment): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    category: r.category ?? undefined,
    currency: toNum(r.currency),
    rarity: r.rarity ?? undefined,
  };
}

function archetypeToRecord(r: CodexArchetype): Record<string, unknown> {
  return { id: r.id, name: r.name ?? '', type: r.type ?? '', description: r.description ?? '' };
}

function creatureFeatToRecord(r: CodexCreatureFeat): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    feat_points: toNum(r.featPoints),
    feat_lvl: toNum(r.featLvl),
    lvl_req: toNum(r.lvlReq),
    mechanic: r.mechanic ?? false,
  };
}

export async function getFeats() {
  const rows = await prisma.codexFeat.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, featToRecord(r)]));
}

export async function getSkills() {
  const rows = await prisma.codexSkill.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, skillToRecord(r)]));
}

export async function getSpecies() {
  const rows = await prisma.codexSpecies.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, speciesToRecord(r)]));
}

export async function getTraits() {
  const rows = await prisma.codexTrait.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, traitToRecord(r)]));
}

export async function getArchetypes() {
  const rows = await prisma.codexArchetype.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, archetypeToRecord(r)]));
}

export async function getPowerParts() {
  const rows = await prisma.codexPart.findMany();
  const filtered = rows.filter((r) => (r.type ?? 'power').toLowerCase() === 'power');
  return Object.fromEntries(filtered.map((r) => [r.id, partToRecord(r)]));
}

export async function getTechniqueParts() {
  const rows = await prisma.codexPart.findMany();
  const filtered = rows.filter((r) => (r.type ?? 'technique').toLowerCase() === 'technique');
  return Object.fromEntries(filtered.map((r) => [r.id, partToRecord(r)]));
}

export async function getItemProperties() {
  const rows = await prisma.codexProperty.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, propertyToRecord(r)]));
}

export async function getEquipment() {
  const rows = await prisma.codexEquipment.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, equipmentToRecord(r)]));
}

export async function getCreatureFeats() {
  const rows = await prisma.codexCreatureFeat.findMany();
  return Object.fromEntries(rows.map((r) => [r.id, creatureFeatToRecord(r)]));
}
