-- =============================================================================
-- characters — RLS so non-owners can SELECT public / campaign-visible sheets
-- =============================================================================
-- Symptom: "Character not found" when viewing another player's character in a
--          campaign (or public link). The Next.js API checks visibility after
--          fetching the row, but RLS only allowed SELECT for the row owner, so
--          .maybeSingle() returned null → 404 before visibility logic ran.
-- Prerequisites: GRANT SELECT ON public.characters TO authenticated (see path-c
--                 part2). campaign_members + campaigns readable per your RLS.
-- Run in Supabase SQL Editor (once per project).
-- =============================================================================

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Public sheets: any logged-in user can read (matches API: visibility = public)
DROP POLICY IF EXISTS "Authenticated can read public characters" ON public.characters;
CREATE POLICY "Authenticated can read public characters"
  ON public.characters FOR SELECT TO authenticated
  USING (COALESCE(data->>'visibility', '') = 'public');

-- Campaign sheets: reader must be campaign owner OR campaign_members row, and
-- this character must appear on that campaign's roster (camelCase or legacy keys)
DROP POLICY IF EXISTS "Authenticated can read campaign-shared characters" ON public.characters;
CREATE POLICY "Authenticated can read campaign-shared characters"
  ON public.characters FOR SELECT TO authenticated
  USING (
    COALESCE(data->>'visibility', '') = 'campaign'
    AND EXISTS (
      SELECT 1
      FROM public.campaigns c
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE
          WHEN c.characters IS NULL THEN '[]'::jsonb
          WHEN jsonb_typeof(c.characters::jsonb) = 'array' THEN c.characters::jsonb
          ELSE '[]'::jsonb
        END
      ) AS elem
      WHERE
        (
          (
            elem ? 'characterId'
            AND elem->>'characterId' = id::text
            AND elem->>'userId' = user_id::text
          )
          OR (
            elem ? 'character_id'
            AND elem->>'character_id' = id::text
            AND elem->>'user_id' = user_id::text
          )
        )
        AND (
          c.owner_id::text = (SELECT auth.uid())::text
          OR EXISTS (
            SELECT 1
            FROM public.campaign_members m
            WHERE m.campaign_id = c.id
              AND m.user_id::text = (SELECT auth.uid())::text
          )
        )
    )
  );
