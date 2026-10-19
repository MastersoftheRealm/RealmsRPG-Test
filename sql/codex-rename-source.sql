-- Rename or merge one codex source across the nine sources text[] columns.
-- Applied on production 2026-10-18; re-applied same day after fixing control-character
-- validation (chr(0) in SQL text is illegal in Postgres). The function only; no rows changed.
-- The first real rename has not run.
--
-- This file is safe to re-run because it only replaces the function, its
-- grants, and this comment. It does not UPDATE any row.
-- The first real rename is a live update and needs a backup first.
-- A second call of the function with the old name changes zero rows, because
-- those rows no longer contain that name and rows already stored with the
-- submitted spelling are left as they are.
--
-- Depends on public.collapse_codex_source_name from
-- sql/codex-entry-sources-open.sql (applied on production 2026-10-17).
-- Do not re-run that file.
--
-- Does not change the column default {Core}. Does not change the app constant
-- CORE_CODEX_SOURCE. A source is only the values stored on rows, so renaming
-- Core rewrites those rows and nothing else. Items with no source are still
-- saved as Core until a developer changes that default. Follow-up task: change
-- the column default and CORE_CODEX_SOURCE together if an empty list should
-- use another name.
--
-- Does not touch the legacy singular source column.
-- Changelog rows are inserted in the same transaction as the rename. A log
-- failure rolls the whole rename back. There is no exception handler.
--
-- The array rewrite matches previewCodexSourceRename in
-- src/lib/codex/sources.ts. Match an element case-insensitively, replace it
-- with the submitted spelling, drop empties, keep the first spelling of each
-- remaining name, and sort by lower(spelling) then spelling in code-unit
-- order (COLLATE "C"). An empty result of that rewrite becomes {Core}.
-- Only a row that already contains the old name or the new name is rewritten.
-- A row that contains neither is not updated.
-- char_length is characters. The admin action rejects a name with
-- String.length first, which counts UTF-16 code units. Those agree for
-- characters in the Basic Multilingual Plane.
-- lower(x COLLATE "C") folds A-Z only. previewCodexSourceRename uses
-- String.toLowerCase. The admin action validates before this function runs.

BEGIN;

CREATE OR REPLACE FUNCTION public.rename_codex_source(
  from_name text,
  to_name text,
  actor uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  from_collapsed text;
  to_collapsed text;
  from_key text;
  to_key text;
  candidate text;
  tables text[] := ARRAY[
    'codex_feats',
    'codex_skills',
    'codex_species',
    'codex_traits',
    'codex_parts',
    'codex_properties',
    'codex_equipment',
    'codex_archetypes',
    'codex_creature_feats'
  ];
  tbl text;
  updated_count integer;
  logged_count integer;
  counts jsonb := '{}'::jsonb;
  total integer := 0;
BEGIN
  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  from_collapsed := public.collapse_codex_source_name(from_name);
  to_collapsed := public.collapse_codex_source_name(to_name);

  FOREACH candidate IN ARRAY ARRAY[from_collapsed, to_collapsed]
  LOOP
    IF candidate IS NULL OR candidate = '' THEN
      RAISE EXCEPTION 'Source name is required.';
    END IF;
    IF char_length(candidate) > 100 THEN
      RAISE EXCEPTION 'Source name must be 100 characters or fewer.';
    END IF;
    IF position('<' IN candidate) > 0 OR position('>' IN candidate) > 0 THEN
      RAISE EXCEPTION 'Source name cannot include HTML.';
    END IF;
    -- Do not use chr(0) here: Postgres rejects a null byte in SQL text (54000).
    IF candidate ~ ('[' || chr(1) || '-' || chr(31) || chr(127) || ']') THEN
      RAISE EXCEPTION 'Source name cannot include control characters.';
    END IF;
    IF lower(candidate COLLATE "C") = 'all' THEN
      RAISE EXCEPTION 'All is reserved and cannot be a source name.';
    END IF;
  END LOOP;

  from_key := lower(from_collapsed COLLATE "C");
  to_key := lower(to_collapsed COLLATE "C");

  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format($q$
      WITH candidates AS (
        SELECT id::text AS entity_id, sources AS old_sources
        FROM public.%I
        WHERE EXISTS (
          SELECT 1
          FROM unnest(sources) AS elem(value)
          WHERE public.collapse_codex_source_name(value) <> ''
            AND lower(public.collapse_codex_source_name(value) COLLATE "C") = ANY ($1::text[])
        )
      ),
      rewritten AS (
        SELECT
          c.entity_id,
          c.old_sources,
          COALESCE(
            (
              SELECT array_agg(
                deduped.spelling
                ORDER BY lower(deduped.spelling) COLLATE "C", deduped.spelling COLLATE "C"
              )
              FROM (
                SELECT DISTINCT ON (lower(mapped.spelling) COLLATE "C") mapped.spelling
                FROM (
                  SELECT
                    CASE
                      WHEN lower(tokens.collapsed COLLATE "C") = ANY ($1::text[]) THEN $2
                      ELSE tokens.collapsed
                    END AS spelling,
                    tokens.ord
                  FROM (
                    SELECT
                      public.collapse_codex_source_name(u.elem) AS collapsed,
                      u.ord
                    FROM unnest(c.old_sources) WITH ORDINALITY AS u(elem, ord)
                  ) AS tokens
                  WHERE tokens.collapsed <> ''
                ) AS mapped
                WHERE mapped.spelling <> ''
                ORDER BY lower(mapped.spelling) COLLATE "C", mapped.ord
              ) AS deduped
            ),
            ARRAY['Core']::text[]
          ) AS new_sources
        FROM candidates AS c
      ),
      changed AS (
        SELECT entity_id, old_sources, new_sources
        FROM rewritten
        WHERE old_sources IS DISTINCT FROM new_sources
      ),
      updated AS (
        UPDATE public.%I AS t
        SET sources = ch.new_sources,
            updated_at = now()
        FROM changed AS ch
        WHERE t.id::text = ch.entity_id
        RETURNING t.id::text AS entity_id, ch.old_sources, ch.new_sources
      ),
      logged AS (
        INSERT INTO public.codex_change_logs (
          entity_type,
          entity_id,
          operation,
          changed_by_user_id,
          before_data,
          after_data,
          changed_fields
        )
        SELECT
          $3,
          u.entity_id,
          'update',
          $4,
          jsonb_build_object('sources', to_jsonb(u.old_sources)),
          jsonb_build_object('sources', to_jsonb(u.new_sources)),
          jsonb_build_array(
            jsonb_build_object(
              'field', 'sources',
              'before', to_jsonb(u.old_sources),
              'after', to_jsonb(u.new_sources)
            )
          )
        FROM updated AS u
        RETURNING entity_id
      )
      SELECT
        (SELECT count(*)::int FROM updated),
        (SELECT count(*)::int FROM logged)
    $q$, tbl, tbl)
    INTO updated_count, logged_count
    USING ARRAY[from_key, to_key], to_collapsed, tbl, actor;

    IF updated_count IS NULL
       OR logged_count IS NULL
       OR updated_count <> logged_count THEN
      RAISE EXCEPTION 'rename changelog count did not match updated rows for %', tbl;
    END IF;

    counts := counts || jsonb_build_object(tbl, updated_count);
    total := total + COALESCE(updated_count, 0);
  END LOOP;

  RETURN counts || jsonb_build_object('total', total);
END;
$fn$;

REVOKE ALL ON FUNCTION public.rename_codex_source(text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rename_codex_source(text, text, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rename_codex_source(text, text, uuid) TO service_role;

COMMENT ON FUNCTION public.rename_codex_source(text, text, uuid) IS
  'Rename or merge one codex source on the nine sources arrays in one transaction, including changelog rows. Does not change the column default {Core} or CORE_CODEX_SOURCE. Items with no source are still saved as Core until a developer changes that default.';

COMMIT;
