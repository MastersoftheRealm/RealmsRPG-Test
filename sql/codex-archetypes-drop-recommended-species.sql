-- TASK-517: Remove path-recommended species (guided/admin use codex_species.is_starter only).
-- Also backfills PathGuidanceGroup.audience on feat groups missing the field (TASK-514 / ADR-0004).
--
-- Audit (RealmsRPG-Test 2026-07-17):
--   - 1 archetype row with non-empty level1_recommended_species (Berserker: "4, 6, 7")
--   - Owner approved DROP COLUMN.
--
-- Apply via Supabase MCP apply_migration or Dashboard SQL Editor.

-- 1) Strip legacy path_data.level1.recommended_species when present.
update public.codex_archetypes
set path_data = path_data #- '{level1,recommended_species}'
where path_data is not null
  and jsonb_typeof(path_data->'level1') = 'object'
  and (path_data->'level1') ? 'recommended_species';

-- 2) Backfill audience on feat guidance groups (column + legacy path_data).
update public.codex_archetypes
set level1_guidance_groups = (
  select coalesce(
    jsonb_agg(
      case
        when jsonb_typeof(elem->'feats') = 'array'
          and jsonb_array_length(elem->'feats') > 0
          and not (elem ? 'audience')
        then elem || jsonb_build_object(
          'audience',
          case
            when lower(coalesce(elem->>'title', '')) like '%character%' then 'character'
            else 'archetype'
          end
        )
        else elem
      end
      order by ord
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(level1_guidance_groups) with ordinality as t(elem, ord)
)
where level1_guidance_groups is not null
  and jsonb_typeof(level1_guidance_groups) = 'array';

update public.codex_archetypes
set path_data = jsonb_set(
  path_data,
  '{level1,guidance_groups}',
  (
    select coalesce(
      jsonb_agg(
        case
          when jsonb_typeof(elem->'feats') = 'array'
            and jsonb_array_length(elem->'feats') > 0
            and not (elem ? 'audience')
          then elem || jsonb_build_object(
            'audience',
            case
              when lower(coalesce(elem->>'title', '')) like '%character%' then 'character'
              else 'archetype'
            end
          )
          else elem
        end
        order by ord
      ),
      '[]'::jsonb
    )
    from jsonb_array_elements(path_data->'level1'->'guidance_groups') with ordinality as t(elem, ord)
  ),
  true
)
where path_data is not null
  and jsonb_typeof(path_data->'level1'->'guidance_groups') = 'array';

-- 3) Drop the columnar field.
alter table public.codex_archetypes
  drop column if exists level1_recommended_species;
