-- Add level1_recommend_unarmed_prowess for path creator (admin codex).
-- Run in Supabase SQL Editor. See SUPABASE_SCHEMA.md.

alter table public.codex_archetypes
  add column if not exists level1_recommend_unarmed_prowess boolean not null default false;
