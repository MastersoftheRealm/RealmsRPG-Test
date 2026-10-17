-- Open codex sources (display names on sources text[]).
-- NOT APPLIED. Do not run this against any database from an agent.
--
-- Applying this file is a production data write. It needs Kadin's approval
-- and a backup first. The function below does not change rows. Run it, then
-- run the dry-run SELECT by itself and read the counts. Run the DO block
-- only after that approval.
--
-- sql/codex-entry-sources.sql is already applied. Do not run it again.
-- Re-running that file puts the closed *_sources_check constraints back
-- and remaps recognized singular labels onto lowercase ids.
--
-- This file:
--   1. Creates public.collapse_codex_source_name(text). It trims and
--      collapses the same characters as collapseCodexSourceName in
--      src/lib/codex/sources.ts (the ES \s set, no u flag). It does not
--      change case. Apostrophes, commas, and other letters stay in the
--      value. A string is one source and is not split on commas.
--   2. Drops public.<table>_sources_check on the nine codex tables.
--      The GIN indexes <table>_sources_gin stay.
--   3. Rewrites row data only when that check is still present. That is
--      the applied-marker. A second run finds the check already gone and
--      does not UPDATE any row, so an admin edit is left as stored,
--      including a deliberate lowercase spelling such as {crafting} or a
--      row set back to {Core}. The second run still sets the default and
--      the column comment.
--      On the first run, for each row whose sources array is still exactly
--      {core}: if the singular source collapses to a non-empty value other
--      than Core (case-insensitive), sources becomes that one name.
--      Otherwise sources becomes {Core}. Then exact {crafting}, {downtime},
--      {harvesting}, {companions}, {homebrew}, and {unreleased} become
--      {Crafting}, {Downtime}, {Harvesting}, {Companions}, {Homebrew}, and
--      {Unreleased}. Any other array, including a multi-value array, is
--      left as stored. Example: source 'Assassin''s Accoutrements' becomes
--      sources {Assassin's Accoutrements}. The source column is not updated.
--   4. Sets the column default to {Core}.
--
-- Rows the first run changes, on each of:
--   codex_feats, codex_skills, codex_species, codex_traits, codex_parts,
--   codex_properties, codex_equipment, codex_archetypes, codex_creature_feats.
--   Production was backfilled to {core}, so those rows become {Core} unless
--   the singular source collapses to a different non-empty name.
--
-- RLS: no policy, grant, or role change. The helper function is not granted
-- to anon or authenticated.
--
-- Deploy order. Apply this file, then deploy the app that writes display
-- names. The current production app (master) reads and writes the singular
-- source column only. It does not read or write sources. This script does
-- not change source, so those reads stay the same. UPDATEs take row locks
-- for the write; concurrent reads are not blocked. A master insert that
-- omits sources picks up the new default {Core} after commit, and a master
-- edit of source after this script does not copy into sources. Deploy the
-- new app before further admin source edits.
--
-- Deploying the new app first, while *_sources_check is still in place:
-- reads prefer sources, which is still {core}, so the legacy labels are
-- hidden. A save of Core or any other display name fails that check.
-- A save that leaves the lowercase id core still passes. Do not use the
-- new editor until this file has been applied.
--
-- Rollback (only after a backup; it cannot restore later admin edits that
-- used a name other than the seven display names). Do not re-run this
-- file to roll back. The check is already gone, so a re-run will not
-- undo the data.
--   1. Undo the legacy copy first, or {Core} rows cannot be told apart.
--      For each table, set sources back to {Core} where cardinality is 1,
--      the single element equals public.collapse_codex_source_name(source),
--      and that element is not Core, Crafting, Downtime, Harvesting,
--      Companions, Homebrew, or Unreleased.
--      This also resets a later admin save that stored that same string
--      as the only source while the singular source column still matches.
--   2. Map exact display-name arrays back to ids:
--        {Core} -> {core}, {Crafting} -> {crafting}, {Downtime} -> {downtime},
--        {Harvesting} -> {harvesting}, {Companions} -> {companions},
--        {Homebrew} -> {homebrew}, {Unreleased} -> {unreleased}.
--   3. Set the default back to {core}.
--   4. Re-add <table>_sources_check only when every row is one or more of
--      those seven ids. A row an admin saved under any other name makes
--      the check fail. Do not drop the GIN indexes. Do not update source.
--   5. DROP FUNCTION IF EXISTS public.collapse_codex_source_name(text);

CREATE OR REPLACE FUNCTION public.collapse_codex_source_name(raw text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $fn$
  SELECT btrim(
    regexp_replace(
      coalesce(raw, ''),
      -- Same code points as CODEX_SOURCE_WHITESPACE_CODE_POINTS.
      -- Replace every run with one space, then btrim that space. That is
      -- trim-then-collapse for this set, including NBSP and line separators.
      -- btrim alone would remove only U+0020.
      '['
        || chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32)
        || chr(160) || chr(5760)
        || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196)
        || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201) || chr(8202)
        || chr(8232) || chr(8233) || chr(8239) || chr(8287) || chr(12288) || chr(65279)
        || ']+',
      ' ',
      'g'
    )
  );
$fn$;

REVOKE ALL ON FUNCTION public.collapse_codex_source_name(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.collapse_codex_source_name(text) FROM anon, authenticated;

-- Dry run. Counts only. Run this SELECT alone before the DO block.
-- exact_* and legacy_copy are the rows the DO block rewrites when
-- check_present is true. When check_present is false, the DO block
-- does not update rows.

SELECT 'codex_feats' AS table_name,
  EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public'
      AND rel.relname = 'codex_feats'
      AND c.conname = 'codex_feats_sources_check'
  ) AS check_present,
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]) AS exact_core,
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]) AS exact_crafting,
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]) AS exact_downtime,
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]) AS exact_harvesting,
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]) AS exact_companions,
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]) AS exact_homebrew,
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]) AS exact_unreleased,
  count(*) FILTER (
    WHERE sources = ARRAY['core']::text[]
      AND public.collapse_codex_source_name(source) <> ''
      AND lower(public.collapse_codex_source_name(source)) <> 'core'
  ) AS legacy_copy
FROM public.codex_feats
UNION ALL
SELECT 'codex_skills',
  EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public' AND rel.relname = 'codex_skills'
      AND c.conname = 'codex_skills_sources_check'
  ),
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE sources = ARRAY['core']::text[]
      AND public.collapse_codex_source_name(source) <> ''
      AND lower(public.collapse_codex_source_name(source)) <> 'core'
  )
FROM public.codex_skills
UNION ALL
SELECT 'codex_species',
  EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public' AND rel.relname = 'codex_species'
      AND c.conname = 'codex_species_sources_check'
  ),
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE sources = ARRAY['core']::text[]
      AND public.collapse_codex_source_name(source) <> ''
      AND lower(public.collapse_codex_source_name(source)) <> 'core'
  )
FROM public.codex_species
UNION ALL
SELECT 'codex_traits',
  EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public' AND rel.relname = 'codex_traits'
      AND c.conname = 'codex_traits_sources_check'
  ),
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE sources = ARRAY['core']::text[]
      AND public.collapse_codex_source_name(source) <> ''
      AND lower(public.collapse_codex_source_name(source)) <> 'core'
  )
FROM public.codex_traits
UNION ALL
SELECT 'codex_parts',
  EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public' AND rel.relname = 'codex_parts'
      AND c.conname = 'codex_parts_sources_check'
  ),
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE sources = ARRAY['core']::text[]
      AND public.collapse_codex_source_name(source) <> ''
      AND lower(public.collapse_codex_source_name(source)) <> 'core'
  )
FROM public.codex_parts
UNION ALL
SELECT 'codex_properties',
  EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public' AND rel.relname = 'codex_properties'
      AND c.conname = 'codex_properties_sources_check'
  ),
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE sources = ARRAY['core']::text[]
      AND public.collapse_codex_source_name(source) <> ''
      AND lower(public.collapse_codex_source_name(source)) <> 'core'
  )
FROM public.codex_properties
UNION ALL
SELECT 'codex_equipment',
  EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public' AND rel.relname = 'codex_equipment'
      AND c.conname = 'codex_equipment_sources_check'
  ),
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE sources = ARRAY['core']::text[]
      AND public.collapse_codex_source_name(source) <> ''
      AND lower(public.collapse_codex_source_name(source)) <> 'core'
  )
FROM public.codex_equipment
UNION ALL
SELECT 'codex_archetypes',
  EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public' AND rel.relname = 'codex_archetypes'
      AND c.conname = 'codex_archetypes_sources_check'
  ),
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE sources = ARRAY['core']::text[]
      AND public.collapse_codex_source_name(source) <> ''
      AND lower(public.collapse_codex_source_name(source)) <> 'core'
  )
FROM public.codex_archetypes
UNION ALL
SELECT 'codex_creature_feats',
  EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    WHERE n.nspname = 'public' AND rel.relname = 'codex_creature_feats'
      AND c.conname = 'codex_creature_feats_sources_check'
  ),
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE sources = ARRAY['core']::text[]
      AND public.collapse_codex_source_name(source) <> ''
      AND lower(public.collapse_codex_source_name(source)) <> 'core'
  )
FROM public.codex_creature_feats;

-- Writes. Do not run until the dry-run counts are accepted.

DO $$
DECLARE
  t text;
  rewrite boolean;
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
      $sql$
        SELECT EXISTS (
          SELECT 1
          FROM pg_constraint c
          JOIN pg_class rel ON rel.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = rel.relnamespace
          WHERE n.nspname = 'public'
            AND rel.relname = %L
            AND c.conname = %L
        )
      $sql$,
      t,
      t || '_sources_check'
    ) INTO rewrite;

    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
      t,
      t || '_sources_check'
    );

    IF rewrite THEN
      EXECUTE format(
        $sql$
          UPDATE public.%I
          SET sources = CASE
            WHEN public.collapse_codex_source_name(source) <> ''
             AND lower(public.collapse_codex_source_name(source)) <> 'core'
            THEN ARRAY[public.collapse_codex_source_name(source)]::text[]
            ELSE ARRAY['Core']::text[]
          END
          WHERE sources = ARRAY['core']::text[]
        $sql$,
        t
      );
      EXECUTE format(
        $sql$
          UPDATE public.%I
          SET sources = ARRAY['Crafting']::text[]
          WHERE sources = ARRAY['crafting']::text[]
        $sql$,
        t
      );
      EXECUTE format(
        $sql$
          UPDATE public.%I
          SET sources = ARRAY['Downtime']::text[]
          WHERE sources = ARRAY['downtime']::text[]
        $sql$,
        t
      );
      EXECUTE format(
        $sql$
          UPDATE public.%I
          SET sources = ARRAY['Harvesting']::text[]
          WHERE sources = ARRAY['harvesting']::text[]
        $sql$,
        t
      );
      EXECUTE format(
        $sql$
          UPDATE public.%I
          SET sources = ARRAY['Companions']::text[]
          WHERE sources = ARRAY['companions']::text[]
        $sql$,
        t
      );
      EXECUTE format(
        $sql$
          UPDATE public.%I
          SET sources = ARRAY['Homebrew']::text[]
          WHERE sources = ARRAY['homebrew']::text[]
        $sql$,
        t
      );
      EXECUTE format(
        $sql$
          UPDATE public.%I
          SET sources = ARRAY['Unreleased']::text[]
          WHERE sources = ARRAY['unreleased']::text[]
        $sql$,
        t
      );
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN sources SET DEFAULT ARRAY[''Core'']::text[]',
      t
    );
    EXECUTE format(
      'COMMENT ON COLUMN public.%I.sources IS %L',
      t,
      'Content packs this entry belongs to. Display names, one or more. Default {Core}.'
    );
  END LOOP;
END $$;
