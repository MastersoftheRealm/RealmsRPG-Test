-- Add columnar archetype-path fields and relational level rows.
-- Run in Supabase SQL Editor.

alter table public.codex_archetypes
  add column if not exists archetype_ability text,
  add column if not exists secondary_ability text,
  add column if not exists power_prof_start integer,
  add column if not exists martial_prof_start integer,
  add column if not exists power_prof_level5 integer,
  add column if not exists martial_prof_level5 integer,
  add column if not exists level1_feats text,
  add column if not exists level1_skills text,
  add column if not exists level1_powers text,
  add column if not exists level1_techniques text,
  add column if not exists level1_armaments text,
  add column if not exists level1_equipment text,
  add column if not exists level1_remove_feats text,
  add column if not exists level1_remove_powers text,
  add column if not exists level1_remove_techniques text,
  add column if not exists level1_remove_armaments text,
  add column if not exists level1_notes text;

create table if not exists public.codex_archetype_levels (
  id bigserial primary key,
  archetype_id text not null references public.codex_archetypes(id) on delete cascade,
  level integer not null check (level >= 2),
  feats text,
  skills text,
  powers text,
  techniques text,
  armaments text,
  equipment text,
  remove_feats text,
  remove_powers text,
  remove_techniques text,
  remove_armaments text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (archetype_id, level)
);
