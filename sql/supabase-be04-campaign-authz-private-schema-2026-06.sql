-- BE-04 (proper fix): move campaign authorization helpers out of the PostgREST-exposed
-- public schema so signed-in users can no longer call them directly via /rest/v1/rpc/*.
--
-- Background: auth_is_campaign_owner / auth_is_campaign_participant are SECURITY DEFINER
-- helpers used inside RLS policies to avoid the campaigns <-> campaign_members recursion
-- (42P17). A SECURITY DEFINER function still requires EXECUTE for the *calling* role when
-- referenced in an RLS policy, so revoking EXECUTE from `authenticated` would break those
-- policies. Therefore the earlier hotfix only revoked `anon`, which left the functions
-- callable by `authenticated` over the REST API (Supabase security advisor
-- 0029_authenticated_security_definer_function_executable).
--
-- Correct remediation (per the advisor): relocate the functions to a dedicated `private`
-- schema that is NOT in PostgREST's exposed schema list. RLS can still reference them
-- (schema exposure does not affect RLS evaluation), but they are no longer reachable as
-- RPCs. Idempotent + transactional.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.auth_is_campaign_owner(p_campaign_id text)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = p_campaign_id
      AND c.owner_id = (select auth.uid())::text
  );
$function$;

CREATE OR REPLACE FUNCTION private.auth_is_campaign_participant(p_campaign_id text)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = p_campaign_id
      AND (
        c.owner_id = (select auth.uid())::text
        OR EXISTS (
          SELECT 1 FROM public.campaign_members m
          WHERE m.campaign_id = c.id
            AND m.user_id = (select auth.uid())::text
        )
      )
  );
$function$;

-- The `private` schema is intentionally NOT granted to anon/authenticated for general USAGE
-- beyond the specific EXECUTE grants the RLS policies need. No PUBLIC execute.
REVOKE ALL ON FUNCTION private.auth_is_campaign_owner(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_is_campaign_participant(text) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.auth_is_campaign_owner(text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.auth_is_campaign_participant(text) TO authenticated;

-- Repoint every dependent policy to the private.* helpers (drop + recreate, preserving
-- the exact command and role set). Order: recreate policies first, then drop public fns.

-- campaign_members ----------------------------------------------------------------------
DROP POLICY IF EXISTS campaign_members_delete_owner_or_self ON public.campaign_members;
CREATE POLICY campaign_members_delete_owner_or_self ON public.campaign_members
  FOR DELETE TO authenticated
  USING ((user_id = (select auth.uid())::text) OR private.auth_is_campaign_owner(campaign_id));

DROP POLICY IF EXISTS campaign_members_insert_owner_or_self ON public.campaign_members;
CREATE POLICY campaign_members_insert_owner_or_self ON public.campaign_members
  FOR INSERT TO authenticated
  WITH CHECK ((user_id = (select auth.uid())::text) OR private.auth_is_campaign_owner(campaign_id));

DROP POLICY IF EXISTS campaign_members_select_participants ON public.campaign_members;
CREATE POLICY campaign_members_select_participants ON public.campaign_members
  FOR SELECT TO authenticated
  USING ((user_id = (select auth.uid())::text) OR private.auth_is_campaign_owner(campaign_id));

-- campaign_rolls ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Campaign participants can read rolls" ON public.campaign_rolls;
CREATE POLICY "Campaign participants can read rolls" ON public.campaign_rolls
  FOR SELECT TO public
  USING (private.auth_is_campaign_participant(campaign_id));

DROP POLICY IF EXISTS "Owner or author deletes rolls" ON public.campaign_rolls;
CREATE POLICY "Owner or author deletes rolls" ON public.campaign_rolls
  FOR DELETE TO public
  USING (
    private.auth_is_campaign_owner(campaign_id)
    OR ((user_id = (select auth.uid())::text) AND private.auth_is_campaign_participant(campaign_id))
  );

DROP POLICY IF EXISTS "Participants insert own rolls" ON public.campaign_rolls;
CREATE POLICY "Participants insert own rolls" ON public.campaign_rolls
  FOR INSERT TO public
  WITH CHECK ((user_id = (select auth.uid())::text) AND private.auth_is_campaign_participant(campaign_id));

-- campaigns -----------------------------------------------------------------------------
DROP POLICY IF EXISTS campaigns_select_participants ON public.campaigns;
CREATE POLICY campaigns_select_participants ON public.campaigns
  FOR SELECT TO authenticated
  USING (private.auth_is_campaign_participant(id));

-- characters (campaign-visibility branch) ----------------------------------------------
DROP POLICY IF EXISTS characters_select_authenticated ON public.characters;
CREATE POLICY characters_select_authenticated ON public.characters
  FOR SELECT TO authenticated
  USING (
    (user_id = (select auth.uid())::text)
    OR (COALESCE((data ->> 'visibility'), '') = 'public')
    OR (
      (COALESCE((data ->> 'visibility'), '') = 'campaign')
      AND EXISTS (
        SELECT 1
        FROM public.campaigns c
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE
            WHEN (c.characters IS NULL) THEN '[]'::jsonb
            WHEN (jsonb_typeof(c.characters) = 'array') THEN c.characters
            ELSE '[]'::jsonb
          END
        ) AS elem(value)
        WHERE (
          (
            (elem.value ? 'characterId')
            AND ((elem.value ->> 'characterId') = characters.id)
            AND ((elem.value ->> 'userId') = characters.user_id)
          )
          OR (
            (elem.value ? 'character_id')
            AND ((elem.value ->> 'character_id') = characters.id)
            AND ((elem.value ->> 'user_id') = characters.user_id)
          )
        )
        AND private.auth_is_campaign_participant(c.id)
      )
    )
  );

-- Finally, remove the API-exposed copies now that nothing references them.
DROP FUNCTION IF EXISTS public.auth_is_campaign_owner(text);
DROP FUNCTION IF EXISTS public.auth_is_campaign_participant(text);

COMMIT;
