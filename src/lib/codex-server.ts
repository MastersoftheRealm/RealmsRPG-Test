/**
 * Codex Data (Supabase) — columnar tables in public
 * Server-side codex fetchers. Use in Server Components or API routes.
 * Returns same shape as API codex payload (id -> record) for compatibility.
 */

import { createClient } from '@/lib/supabase/server';

type Row = Record<string, unknown>;

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

function featToRecord(r: Row): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    req_desc: r.req_desc ?? undefined,
    ability_req: toStrArray(r.ability_req),
    abil_req_val: toNumArray(r.abil_req_val),
    skill_req: toStrArray(r.skill_req),
    skill_req_val: toNumArray(r.skill_req_val),
    feat_cat_req: r.feat_cat_req ?? undefined,
    pow_abil_req: toNum(r.pow_abil_req),
    mart_abil_req: toNum(r.mart_abil_req),
    pow_prof_req: toNum(r.pow_prof_req),
    mart_prof_req: toNum(r.mart_prof_req),
    speed_req: toNum(r.speed_req),
    feat_lvl: toNum(r.feat_lvl),
    lvl_req: toNum(r.lvl_req),
    uses_per_rec: toNum(r.uses_per_rec),
    rec_period: r.rec_period ?? undefined,
    category: r.category ?? undefined,
    ability: r.ability ?? undefined,
    tags: toStrArray(r.tags),
    char_feat: r.char_feat ?? false,
    state_feat: r.state_feat ?? false,
    base_feat_id: r.base_feat_id != null && r.base_feat_id !== '' ? String(r.base_feat_id) : undefined,
  };
}

function skillToRecord(r: Row): Record<string, unknown> {
  const baseSkillId = r.base_skill != null && r.base_skill !== '' ? parseInt(String(r.base_skill), 10) : undefined;
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    ability: r.ability ?? '',
    base_skill_id: baseSkillId != null && !Number.isNaN(baseSkillId) ? baseSkillId : undefined,
    success_desc: r.success_desc ?? undefined,
    failure_desc: r.failure_desc ?? undefined,
    ds_calc: r.ds_calc ?? undefined,
    craft_success_desc: r.craft_success_desc ?? undefined,
    craft_failure_desc: r.craft_failure_desc ?? undefined,
  };
}

function speciesToRecord(r: Row): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    type: r.type ?? '',
    sizes: toStrArray(r.sizes),
    skills: toStrArray(r.skills),
    species_traits: toStrArray(r.species_traits),
    ancestry_traits: toStrArray(r.ancestry_traits),
    flaws: toStrArray(r.flaws),
    characteristics: toStrArray(r.characteristics),
    ave_hgt_cm: toNum(r.ave_hgt_cm),
    ave_wgt_kg: toNum(r.ave_wgt_kg),
    adulthood_lifespan: r.adulthood_lifespan ?? undefined,
    languages: toStrArray(r.languages),
  };
}

function traitToRecord(r: Row): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    uses_per_rec: toNum(r.uses_per_rec),
    rec_period: r.rec_period ?? undefined,
    flaw: r.flaw ?? false,
    characteristic: r.characteristic ?? false,
    option_trait_ids: toStrArray(r.option_trait_ids),
  };
}

function partToRecord(r: Row): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    category: r.category ?? '',
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
    type: ((r.type ?? 'power') as string).toLowerCase(),
    mechanic: r.mechanic ?? false,
    percentage: r.percentage ?? false,
    duration: r.duration ?? false,
    defense: toStrArray(r.defense),
  };
}

function propertyToRecord(r: Row): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    type: r.type ?? undefined,
    base_ip: toNum(r.base_ip),
    base_tp: toNum(r.base_tp),
    base_c: toNum(r.base_c),
    op_1_desc: r.op_1_desc ?? undefined,
    op_1_ip: toNum(r.op_1_ip),
    op_1_tp: toNum(r.op_1_tp),
    op_1_c: toNum(r.op_1_c),
    mechanic: r.mechanic ?? false,
  };
}

function equipmentToRecord(r: Row): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    category: r.category ?? undefined,
    currency: toNum(r.currency),
    rarity: r.rarity ?? undefined,
  };
}

function archetypeToRecord(r: Row): Record<string, unknown> {
  return { id: r.id, name: r.name ?? '', type: r.type ?? '', description: r.description ?? '' };
}

function creatureFeatToRecord(r: Row): Record<string, unknown> {
  return {
    id: r.id,
    name: r.name ?? '',
    description: r.description ?? '',
    feat_points: toNum(r.feat_points),
    feat_lvl: toNum(r.feat_lvl),
    lvl_req: toNum(r.lvl_req),
    mechanic: r.mechanic ?? false,
  };
}

export async function getFeats() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from('codex_feats').select('*');
  const list = (rows ?? []) as Row[];
  return Object.fromEntries(list.map((r) => [String(r.id), featToRecord(r)]));
}

export async function getSkills() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from('codex_skills').select('*');
  const list = (rows ?? []) as Row[];
  return Object.fromEntries(list.map((r) => [String(r.id), skillToRecord(r)]));
}

export async function getSpecies() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from('codex_species').select('*');
  const list = (rows ?? []) as Row[];
  return Object.fromEntries(list.map((r) => [String(r.id), speciesToRecord(r)]));
}

export async function getTraits() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from('codex_traits').select('*');
  const list = (rows ?? []) as Row[];
  return Object.fromEntries(list.map((r) => [String(r.id), traitToRecord(r)]));
}

export async function getArchetypes() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from('codex_archetypes').select('*');
  const list = (rows ?? []) as Row[];
  return Object.fromEntries(list.map((r) => [String(r.id), archetypeToRecord(r)]));
}

export async function getPowerParts() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from('codex_parts').select('*');
  const list = (rows ?? []) as Row[];
  const filtered = list.filter((r) => ((r.type ?? 'power') as string).toLowerCase() === 'power');
  return Object.fromEntries(filtered.map((r) => [String(r.id), partToRecord(r)]));
}

export async function getTechniqueParts() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from('codex_parts').select('*');
  const list = (rows ?? []) as Row[];
  const filtered = list.filter((r) => ((r.type ?? 'technique') as string).toLowerCase() === 'technique');
  return Object.fromEntries(filtered.map((r) => [String(r.id), partToRecord(r)]));
}

export async function getItemProperties() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from('codex_properties').select('*');
  const list = (rows ?? []) as Row[];
  return Object.fromEntries(list.map((r) => [String(r.id), propertyToRecord(r)]));
}

export async function getEquipment() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from('codex_equipment').select('*');
  const list = (rows ?? []) as Row[];
  return Object.fromEntries(list.map((r) => [String(r.id), equipmentToRecord(r)]));
}

export async function getCreatureFeats() {
  const supabase = await createClient();
  const { data: rows } = await supabase.from('codex_creature_feats').select('*');
  const list = (rows ?? []) as Row[];
  return Object.fromEntries(list.map((r) => [String(r.id), creatureFeatToRecord(r)]));
}
