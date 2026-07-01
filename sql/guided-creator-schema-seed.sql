-- Guided ("Simple") character creator — schema extensions + seed data.
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

-- Path recommended abilities + loadout kits for guided creator.
alter table public.codex_archetypes
  add column if not exists level1_recommended_abilities jsonb,
  add column if not exists level1_loadouts jsonb;

comment on column public.codex_archetypes.level1_recommended_abilities is
  'JSON object: ability name -> value for one-click apply in guided creator (e.g. {"strength":3,"vitality":2}).';
comment on column public.codex_archetypes.level1_loadouts is
  'JSON array of loadout objects { id, title, why, armaments[], armor[], equipment[] } for guided equipment step.';

-- Flag common starter species (adjust ids to match your codex).
update public.codex_species
set is_starter = true
where id in ('4', '6', '7', '8', '9', '10')
   or lower(name) in ('human', 'dwarf', 'elf', 'orc', 'halfling', 'goblin');

-- Reference martial path (Berserker id=1): recommended abilities + loadouts.
update public.codex_archetypes
set
  level1_recommended_abilities = coalesce(
    level1_recommended_abilities,
    '{"strength": 3, "vitality": 2, "agility": 1, "acuity": 1, "intelligence": 0, "charisma": 0}'::jsonb
  ),
  level1_loadouts = coalesce(
    level1_loadouts,
    '[
      {
        "id": "berserker-greataxe",
        "title": "Greataxe bruiser",
        "why": "Maximum damage with a two-handed weapon.",
        "armaments": [{"id": "3a4ce0e0-aa9e-4429-a55d-86fdbd6bfdcb", "quantity": 1}]
      },
      {
        "id": "berserker-sword-board",
        "title": "Sword & shield",
        "why": "Balanced offense and defense.",
        "armaments": [
          {"id": "486b9ac9-16e3-49f8-80de-6d4c9ebbf3bc", "quantity": 1},
          {"id": "8ca40c97-851c-4381-a6dd-e0724a6927cf", "quantity": 1}
        ]
      }
    ]'::jsonb
  )
where id = '1';
