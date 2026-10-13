-- 86e3jryyt — a campaign roster can list only joined members' characters
-- =============================================================================
-- Status: APPLIED 2026-10-09 on RealmsRPG-Test (lbqhiwudvifmkjtkccdg)
-- Migration: campaign_roster_members_only (20261009202856)
-- Replay: this file. Does not change campaign_members policies.
--
-- Product rule (Kadin, 2026-10-09): a roster can list a character only when
-- that character's owner has joined the campaign. A removed member loses the
-- campaign-visibility read that the roster JSON used to grant.
--
-- Before: campaigns_owner_update checked only owner_id, so a signed-in owner
-- could write any {userId, characterId} into campaigns.characters.
-- characters_select_authenticated then returned that row when visibility was
-- campaign and the caller was a participant of the campaign they had just
-- edited.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION private.campaign_roster_user_joined(
  p_campaign_id text,
  p_user_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p_user_id IS NOT NULL
    AND btrim(p_user_id) <> ''
    AND EXISTS (
      SELECT 1
      FROM public.campaigns c
      WHERE c.id = p_campaign_id
        AND (
          c.owner_id = p_user_id
          OR EXISTS (
            SELECT 1
            FROM public.campaign_members m
            WHERE m.campaign_id = c.id
              AND m.user_id = p_user_id
          )
        )
    );
$$;

REVOKE ALL ON FUNCTION private.campaign_roster_user_joined(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.campaign_roster_user_joined(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION private.enforce_campaign_roster_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_entry jsonb;
  new_user text;
  new_character text;
  actor text;
BEGIN
  IF NEW.characters IS NULL OR jsonb_typeof(NEW.characters) <> 'array' THEN
    RAISE EXCEPTION 'campaign roster must be a json array'
      USING ERRCODE = '23514';
  END IF;

  actor := (SELECT auth.uid())::text;

  FOR new_entry IN
    SELECT value FROM jsonb_array_elements(NEW.characters)
  LOOP
    IF jsonb_typeof(new_entry) <> 'object' THEN
      RAISE EXCEPTION 'campaign roster entries must be objects'
        USING ERRCODE = '23514';
    END IF;

    new_user := COALESCE(new_entry->>'userId', new_entry->>'user_id');
    new_character := COALESCE(new_entry->>'characterId', new_entry->>'character_id');

    IF new_user IS NULL OR btrim(new_user) = ''
       OR new_character IS NULL OR btrim(new_character) = '' THEN
      RAISE EXCEPTION 'campaign roster entry is missing user or character id'
        USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'UPDATE' AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(
        CASE
          WHEN OLD.characters IS NULL THEN '[]'::jsonb
          WHEN jsonb_typeof(OLD.characters) = 'array' THEN OLD.characters
          ELSE '[]'::jsonb
        END
      ) AS old_entry
      WHERE COALESCE(old_entry->>'userId', old_entry->>'user_id') = new_user
        AND COALESCE(old_entry->>'characterId', old_entry->>'character_id') = new_character
    ) THEN
      CONTINUE;
    END IF;

    IF actor IS NOT NULL AND new_user IS DISTINCT FROM actor THEN
      RAISE EXCEPTION 'roster can only add your own characters'
        USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.characters ch
      WHERE ch.id = new_character
        AND ch.user_id = new_user
    ) THEN
      RAISE EXCEPTION 'roster character is not owned by that user'
        USING ERRCODE = '42501';
    END IF;

    IF new_user IS DISTINCT FROM NEW.owner_id AND NOT EXISTS (
      SELECT 1
      FROM public.campaign_members m
      WHERE m.campaign_id = NEW.id
        AND m.user_id = new_user
    ) THEN
      RAISE EXCEPTION 'roster user has not joined this campaign'
        USING ERRCODE = '42501';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_campaign_roster_members() FROM PUBLIC;

DROP TRIGGER IF EXISTS campaigns_roster_members_only ON public.campaigns;

CREATE TRIGGER campaigns_roster_members_only
  BEFORE INSERT OR UPDATE OF characters ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_campaign_roster_members();

DROP POLICY IF EXISTS characters_select_authenticated ON public.characters;

CREATE POLICY characters_select_authenticated ON public.characters
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())::text
    OR visibility = 'public'
    OR (
      visibility = 'campaign'
      AND EXISTS (
        SELECT 1
        FROM public.campaigns c
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE
            WHEN c.characters IS NULL THEN '[]'::jsonb
            WHEN jsonb_typeof(c.characters) = 'array' THEN c.characters
            ELSE '[]'::jsonb
          END
        ) AS elem(value)
        WHERE (
          (
            (elem.value ? 'characterId')
            AND (elem.value ->> 'characterId') = characters.id
            AND (elem.value ->> 'userId') = characters.user_id
          )
          OR (
            (elem.value ? 'character_id')
            AND (elem.value ->> 'character_id') = characters.id
            AND (elem.value ->> 'user_id') = characters.user_id
          )
        )
        AND private.auth_is_campaign_participant(c.id)
        AND private.campaign_roster_user_joined(
          c.id,
          CASE
            WHEN elem.value ? 'userId' THEN elem.value ->> 'userId'
            ELSE elem.value ->> 'user_id'
          END
        )
      )
    )
  );

COMMIT;
