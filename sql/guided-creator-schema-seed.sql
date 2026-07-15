-- Guided ("Simple") character creator — schema extensions + seed data.
-- Status: Applied on RealmsRPG-Test — migration guided_creator_schema_seed (20260630202719).
-- 2026-07-15 (TASK-442): Quick kits removed from live DB. Do NOT re-seed kit arrays into
--   level1_loadouts. Column now holds optional metadata only: { armorStep?, sharedEquipment? }.
--   Flat recommendations live in level1_armaments / level1_equipment.
-- Agents: apply via Supabase MCP apply_migration (see AGENT_GUIDE.md § Database operations).
-- Human fallback: Supabase SQL Editor (REALMS_PRODUCT_OVERVIEW.md §5.0.2).
--
-- Backup (optional):
--   CREATE TABLE codex_archetypes_backup_guided AS TABLE codex_archetypes;
--   CREATE TABLE codex_species_backup_guided AS TABLE codex_species;

-- Starter species flag (Layer 1 species grid; species are path-ambiguous).
alter table public.codex_species
  add column if not exists is_starter boolean not null default false;

comment on column public.codex_species.is_starter is
  'When true, species appears in the guided creator Layer 1 starter set.';

-- Path recommended abilities + guided equipment metadata column.
alter table public.codex_archetypes
  add column if not exists level1_recommended_abilities jsonb,
  add column if not exists level1_loadouts jsonb;

comment on column public.codex_archetypes.level1_recommended_abilities is
  'JSON object: ability name -> value for one-click apply in guided creator (e.g. {"strength":3,"vitality":2}).';
comment on column public.codex_archetypes.level1_loadouts is
  'Optional JSON metadata for guided equipment: { armorStep?, sharedEquipment? }. Kit arrays removed (TASK-442). Path weapon/armor/gear picks use level1_armaments / level1_equipment.';

-- Flag common starter species (adjust ids to match your codex).
update public.codex_species
set is_starter = true
where id in ('4', '6', '7', '8', '9', '10')
   or lower(name) in ('human', 'dwarf', 'elf', 'orc', 'halfling', 'goblin');

-- Reference martial path (Berserker id=1): recommended abilities only (no kits).
update public.codex_archetypes
set
  level1_recommended_abilities = coalesce(
    level1_recommended_abilities,
    '{"strength": 3, "vitality": 2, "agility": 1, "acuity": 1, "intelligence": 0, "charisma": 0}'::jsonb
  )
where id = '1';
