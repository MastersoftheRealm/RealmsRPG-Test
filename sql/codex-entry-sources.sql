-- Codex entry sources (many per row).
-- APPLIED to production. Do not run this file again.
-- Re-running it puts the closed *_sources_check constraints back and
-- remaps recognized singular labels onto lowercase ids.
-- The follow-up that drops those checks is sql/codex-entry-sources-open.sql.
-- That follow-up is not applied. Do not run either file from an agent.
--
-- Adds public.<codex table>.sources text[] on the same tables as sql/codex-entry-source.sql.
-- Requires that singular source column. This file reads it and does not create it.
-- Does not drop or update the singular source column. That column stays for rollback.
--
-- Default and backfill: sources is NOT NULL and defaults to {core}.
-- Rows that are still null become {core}. A recognized singular source
-- (for example "Crafting Expansion") is copied into sources only when sources
-- is still exactly {core}, so a later edit of sources is not overwritten.
-- Unrecognized free text is left on source and the row stays {core}.
--
-- Allowed ids: core, crafting, downtime, harvesting, companions, homebrew, unreleased.
-- At least one id. Re-running is safe: ADD COLUMN, default, check, and index are idempotent.
-- Re-applying the legacy copy will again map a row that is still exactly {core}
-- and whose source text is a known non-core label.
--
-- RLS: no policy, grant, or role change. Existing row policies cover the new column.
-- Marking a row unreleased does not hide it.
--
-- Rollback (run only to undo this file; it does not restore multi-source edits):
--   DROP INDEX IF EXISTS public.codex_feats_sources_gin;
--   ALTER TABLE public.codex_feats DROP CONSTRAINT IF EXISTS codex_feats_sources_check;
--   ALTER TABLE public.codex_feats DROP COLUMN IF EXISTS sources;
-- Repeat for: codex_skills, codex_species, codex_traits, codex_parts,
-- codex_properties, codex_equipment, codex_archetypes, codex_creature_feats.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'codex_feats',
    'codex_skills',
    'codex_species',
    'codex_traits',
    'codex_parts',
    'codex_properties',
    'codex_equipment',
    'codex_archetypes',
    'codex_creature_feats'
  ]
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS sources text[]',
      t
    );
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN sources SET DEFAULT ARRAY[''core'']::text[]',
      t
    );
    EXECUTE format(
      'UPDATE public.%I SET sources = ARRAY[''core'']::text[] WHERE sources IS NULL',
      t
    );
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN sources SET NOT NULL',
      t
    );
    EXECUTE format(
      $sql$
        UPDATE public.%I
        SET sources = CASE lower(btrim(source))
          WHEN 'crafting' THEN ARRAY['crafting']::text[]
          WHEN 'crafting expansion' THEN ARRAY['crafting']::text[]
          WHEN 'downtime' THEN ARRAY['downtime']::text[]
          WHEN 'downtime expansion' THEN ARRAY['downtime']::text[]
          WHEN 'harvesting' THEN ARRAY['harvesting']::text[]
          WHEN 'harvesting expansion' THEN ARRAY['harvesting']::text[]
          WHEN 'companions' THEN ARRAY['companions']::text[]
          WHEN 'companions expansion' THEN ARRAY['companions']::text[]
          WHEN 'homebrew' THEN ARRAY['homebrew']::text[]
          WHEN 'unreleased' THEN ARRAY['unreleased']::text[]
          WHEN 'unreleased/test' THEN ARRAY['unreleased']::text[]
          WHEN 'test' THEN ARRAY['unreleased']::text[]
          ELSE sources
        END
        WHERE sources = ARRAY['core']::text[]
          AND source IS NOT NULL
          AND lower(btrim(source)) IN (
            'crafting',
            'crafting expansion',
            'downtime',
            'downtime expansion',
            'harvesting',
            'harvesting expansion',
            'companions',
            'companions expansion',
            'homebrew',
            'unreleased',
            'unreleased/test',
            'test'
          )
      $sql$,
      t
    );
    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
      t,
      t || '_sources_check'
    );
    EXECUTE format(
      $sql$
        ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (
          cardinality(sources) >= 1
          AND sources <@ ARRAY['core','crafting','downtime','harvesting','companions','homebrew','unreleased']::text[]
        )
      $sql$,
      t,
      t || '_sources_check'
    );
    EXECUTE format(
      'COMMENT ON COLUMN public.%I.sources IS %L',
      t,
      'Rules sources this entry belongs to. Ids: core, crafting, downtime, harvesting, companions, homebrew, unreleased. At least one. Default {core}.'
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I USING gin (sources)',
      t || '_sources_gin',
      t
    );
  END LOOP;
END $$;
