-- Character creator Layer 1 extensions for codex_archetypes.
-- Adds recommended_species + guidance_groups as first-class columns (non-destructive).
-- Backfills from legacy path_data JSONB when present.
-- Seeds Berserker (id=1) as reference martial path when guidance_groups is still empty.
--
-- Backup (run before applying in Dashboard if not using MCP):
--   CREATE TABLE codex_archetypes_backup_20260629 AS TABLE codex_archetypes;
--   CREATE TABLE codex_archetype_levels_backup_20260629 AS TABLE codex_archetype_levels;

alter table public.codex_archetypes
  add column if not exists level1_recommended_species text,
  add column if not exists level1_guidance_groups jsonb;

comment on column public.codex_archetypes.level1_recommended_species is
  'CSV of species ids/names recommended for this path (species step Layer 1).';
comment on column public.codex_archetypes.level1_guidance_groups is
  'JSON array of Layer 1 build-goal groups (feats/powers/techniques/armaments/equipment + why copy).';

-- Backfill from legacy path_data JSONB (no-op when path_data is null).
update public.codex_archetypes
set level1_recommended_species = coalesce(
  level1_recommended_species,
  (
    select string_agg(elem, ', ' order by ord)
    from jsonb_array_elements_text(path_data->'level1'->'recommended_species') with ordinality as t(elem, ord)
  )
)
where path_data is not null
  and jsonb_typeof(path_data->'level1'->'recommended_species') = 'array'
  and level1_recommended_species is null;

update public.codex_archetypes
set level1_guidance_groups = coalesce(
  level1_guidance_groups,
  path_data->'level1'->'guidance_groups'
)
where path_data is not null
  and jsonb_typeof(path_data->'level1'->'guidance_groups') = 'array'
  and level1_guidance_groups is null;

-- Reference martial path pilot (Berserker) — only when not already authored.
update public.codex_archetypes
set
  level1_recommended_species = coalesce(level1_recommended_species, '4, 6, 7'),
  level1_guidance_groups = coalesce(
    level1_guidance_groups,
    '[
      {
        "id": "berserker-strikes",
        "title": "Devastating strikes",
        "why": "Maximize raw melee damage and crit pressure.",
        "feats": ["313", "63", "78", "465", "546", "536", "753"]
      },
      {
        "id": "berserker-endurance",
        "title": "Stay in the fight",
        "why": "Feats that keep you upright while you press the attack.",
        "feats": ["269", "530", "538", "544", "275"]
      },
      {
        "id": "berserker-kit",
        "title": "Weapon & armor picks",
        "why": "Heavy hitters that match an all-in melee style.",
        "armaments": [
          "3a4ce0e0-aa9e-4429-a55d-86fdbd6bfdcb",
          "486b9ac9-16e3-49f8-80de-6d4c9ebbf3bc",
          "8ca40c97-851c-4381-a6dd-e0724a6927cf"
        ],
        "equipment": ["3:4", "5:2"]
      }
    ]'::jsonb
  ),
  level1_notes = coalesce(
    nullif(trim(level1_notes), ''),
    'Pick a sturdy species, apply the suggested feat groups, then expand to customize weapons and armor.'
  )
where id = '1'
  and level1_guidance_groups is null;
