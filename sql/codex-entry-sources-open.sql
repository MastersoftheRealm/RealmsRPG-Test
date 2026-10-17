-- Open codex sources (display names on sources text[]).
-- NOT APPLIED. Do not run this against any database from an agent.
--
-- Applying this file is a production data write. It needs Kadin's approval
-- and a backup first. Run the dry-run SELECT by itself, read the counts,
-- then run the DO block only after that approval.
--
-- sql/codex-entry-sources.sql is already applied. Do not run it again.
-- Re-running that file puts the closed *_sources_check constraints back
-- and remaps recognized singular labels onto lowercase ids.
--
-- This file does not add a table, a column, or an index. It:
--   1. Drops public.<table>_sources_check on the nine codex tables.
--      The GIN indexes <table>_sources_gin stay.
--   2. Rewrites a row only when sources is still exactly one known id:
--        {core} {crafting} {downtime} {harvesting} {companions}
--        {homebrew} {unreleased}
--      to the display name {Core} {Crafting} {Downtime} {Harvesting}
--      {Companions} {Homebrew} {Unreleased}.
--      Any other array, including a multi-value array, is left as stored.
--   3. After that rewrite, copies the singular source text into sources
--      when sources is still exactly {Core}, source is non-empty after
--      trim and whitespace collapse, and that value is not Core
--      (case-insensitive). The collapsed text is copied verbatim.
--      Example: source 'Companion Expansion' becomes sources
--      {Companion Expansion}. This file does not rename or shorten it.
--      The source column is not updated.
--   4. Sets the column default to {Core}.
--
-- Rows this changes, on each of the nine tables:
--   codex_feats, codex_skills, codex_species, codex_traits, codex_parts,
--   codex_properties, codex_equipment, codex_archetypes, codex_creature_feats.
--   - Every row whose sources array is still exactly one of the seven ids.
--     Production was backfilled to {core}, so those rows become {Core}
--     unless step 3 replaces them.
--   - Then every row whose sources is exactly {Core} (including rows step 2
--     just renamed from {core}) and whose singular source collapses to a
--     non-empty value other than Core. Those rows become a one-element
--     array of that collapsed source text.
--   Rows that already have any other sources value are not updated.
--
-- Re-running step 3 will again copy source onto a row that an admin has
-- set back to exactly {Core} while source is still a different non-empty
-- value. Do not re-run after admins have edited those rows.
--
-- RLS: no policy, grant, or role change.
--
-- Rollback (only after a backup; it cannot restore later admin edits that
-- used a name other than the seven display names):
--   1. Undo the legacy copy first, or {Core} rows cannot be told apart.
--      For each table, set sources back to {Core} where cardinality is 1,
--      the single element equals regexp_replace(btrim(source), '\s+', ' ', 'g'),
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

-- Dry run. Counts only. Run this SELECT alone before the DO block.

SELECT 'codex_feats' AS table_name,
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]) AS exact_core,
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]) AS exact_crafting,
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]) AS exact_downtime,
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]) AS exact_harvesting,
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]) AS exact_companions,
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]) AS exact_homebrew,
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]) AS exact_unreleased,
  count(*) FILTER (
    WHERE (sources = ARRAY['core']::text[] OR sources = ARRAY['Core']::text[])
      AND source IS NOT NULL
      AND regexp_replace(btrim(source), '\s+', ' ', 'g') <> ''
      AND lower(regexp_replace(btrim(source), '\s+', ' ', 'g')) <> 'core'
  ) AS legacy_copy
FROM public.codex_feats
UNION ALL
SELECT 'codex_skills',
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE (sources = ARRAY['core']::text[] OR sources = ARRAY['Core']::text[])
      AND source IS NOT NULL
      AND regexp_replace(btrim(source), '\s+', ' ', 'g') <> ''
      AND lower(regexp_replace(btrim(source), '\s+', ' ', 'g')) <> 'core'
  )
FROM public.codex_skills
UNION ALL
SELECT 'codex_species',
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE (sources = ARRAY['core']::text[] OR sources = ARRAY['Core']::text[])
      AND source IS NOT NULL
      AND regexp_replace(btrim(source), '\s+', ' ', 'g') <> ''
      AND lower(regexp_replace(btrim(source), '\s+', ' ', 'g')) <> 'core'
  )
FROM public.codex_species
UNION ALL
SELECT 'codex_traits',
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE (sources = ARRAY['core']::text[] OR sources = ARRAY['Core']::text[])
      AND source IS NOT NULL
      AND regexp_replace(btrim(source), '\s+', ' ', 'g') <> ''
      AND lower(regexp_replace(btrim(source), '\s+', ' ', 'g')) <> 'core'
  )
FROM public.codex_traits
UNION ALL
SELECT 'codex_parts',
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE (sources = ARRAY['core']::text[] OR sources = ARRAY['Core']::text[])
      AND source IS NOT NULL
      AND regexp_replace(btrim(source), '\s+', ' ', 'g') <> ''
      AND lower(regexp_replace(btrim(source), '\s+', ' ', 'g')) <> 'core'
  )
FROM public.codex_parts
UNION ALL
SELECT 'codex_properties',
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE (sources = ARRAY['core']::text[] OR sources = ARRAY['Core']::text[])
      AND source IS NOT NULL
      AND regexp_replace(btrim(source), '\s+', ' ', 'g') <> ''
      AND lower(regexp_replace(btrim(source), '\s+', ' ', 'g')) <> 'core'
  )
FROM public.codex_properties
UNION ALL
SELECT 'codex_equipment',
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE (sources = ARRAY['core']::text[] OR sources = ARRAY['Core']::text[])
      AND source IS NOT NULL
      AND regexp_replace(btrim(source), '\s+', ' ', 'g') <> ''
      AND lower(regexp_replace(btrim(source), '\s+', ' ', 'g')) <> 'core'
  )
FROM public.codex_equipment
UNION ALL
SELECT 'codex_archetypes',
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE (sources = ARRAY['core']::text[] OR sources = ARRAY['Core']::text[])
      AND source IS NOT NULL
      AND regexp_replace(btrim(source), '\s+', ' ', 'g') <> ''
      AND lower(regexp_replace(btrim(source), '\s+', ' ', 'g')) <> 'core'
  )
FROM public.codex_archetypes
UNION ALL
SELECT 'codex_creature_feats',
  count(*) FILTER (WHERE sources = ARRAY['core']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['crafting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['downtime']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['harvesting']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['companions']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['homebrew']::text[]),
  count(*) FILTER (WHERE sources = ARRAY['unreleased']::text[]),
  count(*) FILTER (
    WHERE (sources = ARRAY['core']::text[] OR sources = ARRAY['Core']::text[])
      AND source IS NOT NULL
      AND regexp_replace(btrim(source), '\s+', ' ', 'g') <> ''
      AND lower(regexp_replace(btrim(source), '\s+', ' ', 'g')) <> 'core'
  )
FROM public.codex_creature_feats;

-- Writes. Do not run until the dry-run counts are accepted.

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
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
      t,
      t || '_sources_check'
    );
    EXECUTE format(
      $sql$
        UPDATE public.%I
        SET sources = ARRAY['Core']::text[]
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
    EXECUTE format(
      $sql$
        UPDATE public.%I
        SET sources = ARRAY[regexp_replace(btrim(source), '\s+', ' ', 'g')]::text[]
        WHERE sources = ARRAY['Core']::text[]
          AND source IS NOT NULL
          AND regexp_replace(btrim(source), '\s+', ' ', 'g') <> ''
          AND lower(regexp_replace(btrim(source), '\s+', ' ', 'g')) <> 'core'
      $sql$,
      t
    );
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
