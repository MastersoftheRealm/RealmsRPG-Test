-- Campaign rolls: additive relational expansion.
--
-- This compatibility phase keeps campaign_rolls.data as the application write
-- contract. A later application cutover and contract migration will remove the
-- JSONB column and the two compatibility triggers created here.
--
-- Do not apply to a shared or production database without explicit approval
-- and a fresh backup.

BEGIN;

LOCK TABLE public.campaign_rolls IN SHARE ROW EXCLUSIVE MODE;

-- Return the stored roll time without throwing. A NULL result means the JSON
-- timestamp is absent or cannot be represented as timestamptz.
CREATE OR REPLACE FUNCTION private.campaign_roll_payload_rolled_at(p_data jsonb)
RETURNS timestamp(3) with time zone
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $function$
DECLARE
  v_timestamp jsonb;
  v_seconds double precision;
  v_nanoseconds double precision := 0;
  v_result timestamp with time zone;
BEGIN
  IF jsonb_typeof(p_data) <> 'object' THEN
    RETURN NULL;
  END IF;

  v_timestamp := p_data->'timestamp';

  IF v_timestamp IS NULL OR jsonb_typeof(v_timestamp) = 'null' THEN
    RETURN NULL;
  END IF;

  IF jsonb_typeof(v_timestamp) = 'string' THEN
    IF (p_data->>'timestamp') !~
       '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})$' THEN
      RETURN NULL;
    END IF;

    BEGIN
      v_result := (p_data->>'timestamp')::timestamp with time zone;
      RETURN v_result::timestamp(3) with time zone;
    EXCEPTION
      WHEN invalid_datetime_format OR datetime_field_overflow THEN
        RETURN NULL;
    END;
  END IF;

  IF jsonb_typeof(v_timestamp) = 'object'
     AND jsonb_typeof(v_timestamp->'seconds') = 'number'
     AND (
       v_timestamp->'nanoseconds' IS NULL
       OR jsonb_typeof(v_timestamp->'nanoseconds') = 'null'
       OR jsonb_typeof(v_timestamp->'nanoseconds') = 'number'
     ) THEN
    BEGIN
      v_seconds := (v_timestamp->>'seconds')::double precision;
      v_nanoseconds := coalesce(
        (v_timestamp->>'nanoseconds')::double precision,
        0
      );

      IF v_nanoseconds < 0 OR v_nanoseconds >= 1000000000 THEN
        RETURN NULL;
      END IF;

      v_result := pg_catalog.to_timestamp(v_seconds + (v_nanoseconds / 1000000000));
      RETURN v_result::timestamp(3) with time zone;
    EXCEPTION
      WHEN numeric_value_out_of_range OR datetime_field_overflow THEN
        RETURN NULL;
    END;
  END IF;

  RETURN NULL;
END;
$function$;

-- Return the first incompatible payload field. The same validator protects the
-- initial backfill and legacy JSON writes made while this expand phase is live.
CREATE OR REPLACE FUNCTION private.campaign_roll_payload_issue(p_data jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $function$
DECLARE
  v_die jsonb;
  v_die_type text;
  v_die_value numeric;
BEGIN
  IF jsonb_typeof(p_data) <> 'object' THEN
    RETURN 'data must be an object';
  END IF;

  IF jsonb_typeof(p_data->'characterName') <> 'string'
     OR nullif(p_data->>'characterName', '') IS NULL THEN
    RETURN 'characterName must be a non-empty string';
  END IF;

  IF p_data ? 'characterId'
     AND (
       jsonb_typeof(p_data->'characterId') <> 'string'
       OR nullif(p_data->>'characterId', '') IS NULL
     ) THEN
    RETURN 'characterId must be a non-empty string when present';
  END IF;

  IF p_data ? 'userId'
     AND (
       jsonb_typeof(p_data->'userId') <> 'string'
       OR nullif(p_data->>'userId', '') IS NULL
     ) THEN
    RETURN 'userId must be a non-empty string when present';
  END IF;

  IF p_data ? 'type'
     AND (
       jsonb_typeof(p_data->'type') <> 'string'
       OR p_data->>'type' NOT IN ('attack', 'damage', 'skill', 'ability', 'defense', 'custom')
     ) THEN
    RETURN 'type is not a recognized campaign roll type';
  END IF;

  IF p_data ? 'title'
     AND (
       jsonb_typeof(p_data->'title') <> 'string'
       OR nullif(p_data->>'title', '') IS NULL
     ) THEN
    RETURN 'title must be a non-empty string when present';
  END IF;

  IF p_data ? 'rolledByRealmMaster'
     AND jsonb_typeof(p_data->'rolledByRealmMaster') NOT IN ('boolean', 'null') THEN
    RETURN 'rolledByRealmMaster must be boolean or null';
  END IF;

  IF p_data ? 'modifier'
     AND jsonb_typeof(p_data->'modifier') NOT IN ('number', 'null') THEN
    RETURN 'modifier must be numeric or null';
  END IF;

  IF p_data ? 'modifierLabel'
     AND jsonb_typeof(p_data->'modifierLabel') NOT IN ('string', 'null') THEN
    RETURN 'modifierLabel must be string or null';
  END IF;

  IF p_data ? 'total'
     AND jsonb_typeof(p_data->'total') NOT IN ('number', 'null') THEN
    RETURN 'total must be numeric or null';
  END IF;

  IF p_data ? 'isCrit'
     AND jsonb_typeof(p_data->'isCrit') NOT IN ('boolean', 'null') THEN
    RETURN 'isCrit must be boolean or null';
  END IF;

  IF p_data ? 'isCritFail'
     AND jsonb_typeof(p_data->'isCritFail') NOT IN ('boolean', 'null') THEN
    RETURN 'isCritFail must be boolean or null';
  END IF;

  IF p_data ? 'critMessage'
     AND jsonb_typeof(p_data->'critMessage') NOT IN ('string', 'null') THEN
    RETURN 'critMessage must be string or null';
  END IF;

  IF p_data ? 'timestamp'
     AND jsonb_typeof(p_data->'timestamp') <> 'null'
     AND private.campaign_roll_payload_rolled_at(p_data) IS NULL THEN
    RETURN 'timestamp is not a supported ISO or Firestore timestamp';
  END IF;

  IF p_data ? 'dice'
     AND jsonb_typeof(p_data->'dice') NOT IN ('array', 'null') THEN
    RETURN 'dice must be an array or null';
  END IF;

  FOR v_die IN
    SELECT value
    FROM jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(p_data->'dice') = 'array' THEN p_data->'dice'
        ELSE '[]'::jsonb
      END
    )
  LOOP
    IF jsonb_typeof(v_die) <> 'object' THEN
      RETURN 'every die must be an object';
    END IF;

    IF jsonb_typeof(v_die->'type') <> 'string' THEN
      RETURN 'every die type must be a string';
    END IF;

    v_die_type := v_die->>'type';
    IF v_die_type NOT IN ('d2', 'd4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100') THEN
      RETURN 'die type is not recognized';
    END IF;

    IF jsonb_typeof(v_die->'value') <> 'number' THEN
      RETURN 'every die value must be numeric';
    END IF;

    v_die_value := (v_die->>'value')::numeric;
    IF v_die_value <> trunc(v_die_value)
       OR v_die_value < 1
       OR v_die_value > (CASE v_die_type
         WHEN 'd2' THEN 2
         WHEN 'd4' THEN 4
         WHEN 'd6' THEN 6
         WHEN 'd8' THEN 8
         WHEN 'd10' THEN 10
         WHEN 'd12' THEN 12
         WHEN 'd20' THEN 20
         WHEN 'd100' THEN 100
       END) THEN
      RETURN 'die value is outside its die range';
    END IF;

    IF v_die ? 'isMax'
       AND jsonb_typeof(v_die->'isMax') NOT IN ('boolean', 'null') THEN
      RETURN 'die isMax must be boolean or null';
    END IF;

    IF v_die ? 'isMin'
       AND jsonb_typeof(v_die->'isMin') NOT IN ('boolean', 'null') THEN
      RETURN 'die isMin must be boolean or null';
    END IF;
  END LOOP;

  BEGIN
    PERFORM (p_data->>'modifier')::double precision
    WHERE jsonb_typeof(p_data->'modifier') = 'number';
    PERFORM (p_data->>'total')::double precision
    WHERE jsonb_typeof(p_data->'total') = 'number';
  EXCEPTION
    WHEN numeric_value_out_of_range THEN
      RETURN 'modifier or total cannot be represented as double precision';
  END;

  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION private.campaign_roll_payload_rolled_at(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.campaign_roll_payload_issue(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.campaign_roll_payload_rolled_at(jsonb) FROM anon, authenticated;
REVOKE ALL ON FUNCTION private.campaign_roll_payload_issue(jsonb) FROM anon, authenticated;

-- Abort before DDL/backfill if any legacy document cannot be copied exactly.
DO $preflight$
DECLARE
  v_count bigint;
  v_samples text[];
BEGIN
  SELECT count(*), (array_agg(id ORDER BY id))[1:10]
  INTO v_count, v_samples
  FROM public.campaign_rolls
  WHERE private.campaign_roll_payload_issue(data) IS NOT NULL;

  IF v_count > 0 THEN
    RAISE EXCEPTION
      'campaign_rolls relational preflight failed: % invalid payload(s), sample ids: %',
      v_count,
      v_samples;
  END IF;

  SELECT count(*), (array_agg(id ORDER BY id))[1:10]
  INTO v_count, v_samples
  FROM public.campaign_rolls
  WHERE nullif(coalesce(character_id, data->>'characterId'), '') IS NULL
     OR nullif(coalesce(user_id, data->>'userId'), '') IS NULL
     OR nullif(coalesce(type, data->>'type'), '') IS NULL
     OR coalesce(type, data->>'type') NOT IN
       ('attack', 'damage', 'skill', 'ability', 'defense', 'custom')
     OR nullif(coalesce(title, data->>'title'), '') IS NULL
     OR coalesce(
       private.campaign_roll_payload_rolled_at(data),
       created_at AT TIME ZONE 'UTC'
     ) IS NULL;

  IF v_count > 0 THEN
    RAISE EXCEPTION
      'campaign_rolls relational preflight failed: % row(s) lack a required relational value, sample ids: %',
      v_count,
      v_samples;
  END IF;
END;
$preflight$;

ALTER TABLE public.campaign_rolls
  ADD COLUMN IF NOT EXISTS character_name text,
  ADD COLUMN IF NOT EXISTS rolled_at timestamp(3) with time zone,
  ADD COLUMN IF NOT EXISTS rolled_by_realm_master boolean,
  ADD COLUMN IF NOT EXISTS modifier double precision,
  ADD COLUMN IF NOT EXISTS modifier_label text,
  ADD COLUMN IF NOT EXISTS total double precision,
  ADD COLUMN IF NOT EXISTS is_crit boolean,
  ADD COLUMN IF NOT EXISTS is_crit_fail boolean,
  ADD COLUMN IF NOT EXISTS crit_message text;

CREATE TABLE IF NOT EXISTS public.campaign_roll_dice (
  campaign_roll_id text NOT NULL
    REFERENCES public.campaign_rolls(id) ON UPDATE CASCADE ON DELETE CASCADE,
  position integer NOT NULL CHECK (position > 0),
  die_type text NOT NULL,
  value integer NOT NULL,
  is_max boolean,
  is_min boolean,
  PRIMARY KEY (campaign_roll_id, position),
  CONSTRAINT campaign_roll_dice_value_check CHECK (
    (die_type = 'd2' AND value BETWEEN 1 AND 2)
    OR (die_type = 'd4' AND value BETWEEN 1 AND 4)
    OR (die_type = 'd6' AND value BETWEEN 1 AND 6)
    OR (die_type = 'd8' AND value BETWEEN 1 AND 8)
    OR (die_type = 'd10' AND value BETWEEN 1 AND 10)
    OR (die_type = 'd12' AND value BETWEEN 1 AND 12)
    OR (die_type = 'd20' AND value BETWEEN 1 AND 20)
    OR (die_type = 'd100' AND value BETWEEN 1 AND 100)
  )
);

COMMENT ON TABLE public.campaign_roll_dice IS
  'Ordered die results for campaign rolls; relational replacement for campaign_rolls.data.dice.';

ALTER TABLE public.campaign_roll_dice ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS campaign_roll_dice_select_participants
  ON public.campaign_roll_dice;
CREATE POLICY campaign_roll_dice_select_participants
  ON public.campaign_roll_dice
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.campaign_rolls roll
      WHERE roll.id = campaign_roll_id
        AND private.auth_is_campaign_participant(roll.campaign_id)
    )
  );

DROP POLICY IF EXISTS campaign_roll_dice_insert_author
  ON public.campaign_roll_dice;
CREATE POLICY campaign_roll_dice_insert_author
  ON public.campaign_roll_dice
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.campaign_rolls roll
      WHERE roll.id = campaign_roll_id
        AND roll.user_id = ((SELECT auth.uid()))::text
        AND private.auth_is_campaign_participant(roll.campaign_id)
    )
  );

DROP POLICY IF EXISTS campaign_roll_dice_update_owner_or_author
  ON public.campaign_roll_dice;
CREATE POLICY campaign_roll_dice_update_owner_or_author
  ON public.campaign_roll_dice
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.campaign_rolls roll
      WHERE roll.id = campaign_roll_id
        AND (
          private.auth_is_campaign_owner(roll.campaign_id)
          OR (
            roll.user_id = ((SELECT auth.uid()))::text
            AND private.auth_is_campaign_participant(roll.campaign_id)
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.campaign_rolls roll
      WHERE roll.id = campaign_roll_id
        AND (
          private.auth_is_campaign_owner(roll.campaign_id)
          OR (
            roll.user_id = ((SELECT auth.uid()))::text
            AND private.auth_is_campaign_participant(roll.campaign_id)
          )
        )
    )
  );

DROP POLICY IF EXISTS campaign_roll_dice_delete_owner_or_author
  ON public.campaign_roll_dice;
CREATE POLICY campaign_roll_dice_delete_owner_or_author
  ON public.campaign_roll_dice
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.campaign_rolls roll
      WHERE roll.id = campaign_roll_id
        AND (
          private.auth_is_campaign_owner(roll.campaign_id)
          OR (
            roll.user_id = ((SELECT auth.uid()))::text
            AND private.auth_is_campaign_participant(roll.campaign_id)
          )
        )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_roll_dice TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_roll_dice TO service_role;
REVOKE ALL ON public.campaign_roll_dice FROM anon;

-- Match the current GET behavior for old rows whose stored RM flag predates the
-- flag itself: a campaign owner rolling another roster user's character is RM.
CREATE OR REPLACE FUNCTION private.campaign_roll_effective_rm(
  p_campaign_id text,
  p_character_id text,
  p_user_id text,
  p_data jsonb
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT
    coalesce(
      CASE
        WHEN jsonb_typeof(p_data->'rolledByRealmMaster') = 'boolean'
          THEN (p_data->>'rolledByRealmMaster')::boolean
        ELSE false
      END,
      false
    )
    OR EXISTS (
      SELECT 1
      FROM public.campaigns campaign
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE
          WHEN jsonb_typeof(campaign.characters) = 'array' THEN campaign.characters
          ELSE '[]'::jsonb
        END
      ) roster(entry)
      WHERE campaign.id = p_campaign_id
        AND campaign.owner_id = p_user_id
        AND roster.entry->>'characterId' = p_character_id
        AND nullif(roster.entry->>'userId', '') IS NOT NULL
        AND roster.entry->>'userId' <> campaign.owner_id
    );
$function$;

CREATE OR REPLACE FUNCTION private.sync_campaign_roll_parent_from_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_issue text;
BEGIN
  v_issue := private.campaign_roll_payload_issue(NEW.data);
  IF v_issue IS NOT NULL THEN
    RAISE EXCEPTION 'invalid campaign roll payload for id %: %', NEW.id, v_issue;
  END IF;

  -- Existing promoted columns are trusted when already present.
  NEW.character_id := coalesce(NEW.character_id, NEW.data->>'characterId');
  NEW.user_id := coalesce(NEW.user_id, NEW.data->>'userId');
  NEW.type := coalesce(NEW.type, NEW.data->>'type');
  NEW.title := coalesce(NEW.title, NEW.data->>'title');

  NEW.character_name := NEW.data->>'characterName';
  NEW.rolled_at := coalesce(
    private.campaign_roll_payload_rolled_at(NEW.data),
    NEW.created_at AT TIME ZONE 'UTC',
    NEW.rolled_at
  );
  NEW.created_at := coalesce(
    NEW.created_at,
    NEW.rolled_at AT TIME ZONE 'UTC'
  );
  NEW.modifier := coalesce(
    CASE WHEN jsonb_typeof(NEW.data->'modifier') = 'number'
      THEN (NEW.data->>'modifier')::double precision END,
    0
  );
  NEW.modifier_label := CASE
    WHEN jsonb_typeof(NEW.data->'modifierLabel') = 'string'
      THEN NEW.data->>'modifierLabel'
    ELSE NULL
  END;
  NEW.total := coalesce(
    CASE WHEN jsonb_typeof(NEW.data->'total') = 'number'
      THEN (NEW.data->>'total')::double precision END,
    0
  );
  NEW.is_crit := CASE
    WHEN jsonb_typeof(NEW.data->'isCrit') = 'boolean'
      THEN (NEW.data->>'isCrit')::boolean
    ELSE NULL
  END;
  NEW.is_crit_fail := CASE
    WHEN jsonb_typeof(NEW.data->'isCritFail') = 'boolean'
      THEN (NEW.data->>'isCritFail')::boolean
    ELSE NULL
  END;
  NEW.crit_message := CASE
    WHEN jsonb_typeof(NEW.data->'critMessage') = 'string'
      THEN NEW.data->>'critMessage'
    ELSE NULL
  END;

  IF nullif(NEW.character_id, '') IS NULL
     OR nullif(NEW.user_id, '') IS NULL
     OR nullif(NEW.type, '') IS NULL
     OR NEW.type NOT IN ('attack', 'damage', 'skill', 'ability', 'defense', 'custom')
     OR nullif(NEW.title, '') IS NULL
     OR nullif(NEW.character_name, '') IS NULL
     OR NEW.rolled_at IS NULL
     OR NEW.created_at IS NULL THEN
    RAISE EXCEPTION 'campaign roll id % lacks a required relational value', NEW.id;
  END IF;

  NEW.rolled_by_realm_master := private.campaign_roll_effective_rm(
    NEW.campaign_id,
    NEW.character_id,
    NEW.user_id,
    NEW.data
  );

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION private.sync_campaign_roll_dice_from_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  DELETE FROM public.campaign_roll_dice
  WHERE campaign_roll_id = NEW.id;

  INSERT INTO public.campaign_roll_dice (
    campaign_roll_id,
    position,
    die_type,
    value,
    is_max,
    is_min
  )
  SELECT
    NEW.id,
    die.ordinality::integer,
    die.entry->>'type',
    (die.entry->>'value')::integer,
    CASE WHEN jsonb_typeof(die.entry->'isMax') = 'boolean'
      THEN (die.entry->>'isMax')::boolean END,
    CASE WHEN jsonb_typeof(die.entry->'isMin') = 'boolean'
      THEN (die.entry->>'isMin')::boolean END
  FROM jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(NEW.data->'dice') = 'array' THEN NEW.data->'dice'
      ELSE '[]'::jsonb
    END
  ) WITH ORDINALITY AS die(entry, ordinality);

  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION private.campaign_roll_effective_rm(text, text, text, jsonb)
  FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sync_campaign_roll_parent_from_data()
  FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sync_campaign_roll_dice_from_data()
  FROM PUBLIC;
REVOKE ALL ON FUNCTION private.campaign_roll_effective_rm(text, text, text, jsonb)
  FROM anon, authenticated;
REVOKE ALL ON FUNCTION private.sync_campaign_roll_parent_from_data()
  FROM anon, authenticated;
REVOKE ALL ON FUNCTION private.sync_campaign_roll_dice_from_data()
  FROM anon, authenticated;

DROP TRIGGER IF EXISTS campaign_rolls_relational_parent_sync
  ON public.campaign_rolls;
CREATE TRIGGER campaign_rolls_relational_parent_sync
BEFORE INSERT OR UPDATE OF data ON public.campaign_rolls
FOR EACH ROW
EXECUTE FUNCTION private.sync_campaign_roll_parent_from_data();

DROP TRIGGER IF EXISTS campaign_rolls_relational_dice_sync
  ON public.campaign_rolls;
CREATE TRIGGER campaign_rolls_relational_dice_sync
AFTER INSERT OR UPDATE OF data ON public.campaign_rolls
FOR EACH ROW
EXECUTE FUNCTION private.sync_campaign_roll_dice_from_data();

-- Route every existing row through the compatibility path. This also makes a
-- rerun exact and idempotent: child dice are replaced rather than appended.
UPDATE public.campaign_rolls
SET data = data;

ALTER TABLE public.campaign_rolls
  ALTER COLUMN character_id SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN type SET NOT NULL,
  ALTER COLUMN title SET NOT NULL,
  ALTER COLUMN character_name SET NOT NULL,
  ALTER COLUMN rolled_at SET NOT NULL,
  ALTER COLUMN rolled_by_realm_master SET DEFAULT false,
  ALTER COLUMN rolled_by_realm_master SET NOT NULL,
  ALTER COLUMN modifier SET DEFAULT 0,
  ALTER COLUMN modifier SET NOT NULL,
  ALTER COLUMN total SET DEFAULT 0,
  ALTER COLUMN total SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT (now() AT TIME ZONE 'UTC'),
  ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.campaign_rolls
  DROP CONSTRAINT IF EXISTS campaign_rolls_type_check;
ALTER TABLE public.campaign_rolls
  ADD CONSTRAINT campaign_rolls_type_check CHECK (
    type IN ('attack', 'damage', 'skill', 'ability', 'defense', 'custom')
  );

-- Fail the transaction if the relational copy differs from the source JSON or
-- contains an extra/missing ordered die.
DO $parity$
DECLARE
  v_count bigint;
  v_samples text[];
BEGIN
  SELECT count(*), (array_agg(roll.id ORDER BY roll.id))[1:10]
  INTO v_count, v_samples
  FROM public.campaign_rolls roll
  WHERE roll.character_name IS DISTINCT FROM roll.data->>'characterName'
     OR roll.rolled_at IS DISTINCT FROM coalesce(
       private.campaign_roll_payload_rolled_at(roll.data),
       roll.created_at AT TIME ZONE 'UTC'
     )
     OR roll.rolled_by_realm_master IS DISTINCT FROM private.campaign_roll_effective_rm(
       roll.campaign_id,
       roll.character_id,
       roll.user_id,
       roll.data
     )
     OR roll.modifier IS DISTINCT FROM coalesce(
       CASE WHEN jsonb_typeof(roll.data->'modifier') = 'number'
         THEN (roll.data->>'modifier')::double precision END,
       0
     )
     OR roll.modifier_label IS DISTINCT FROM CASE
       WHEN jsonb_typeof(roll.data->'modifierLabel') = 'string'
         THEN roll.data->>'modifierLabel' END
     OR roll.total IS DISTINCT FROM coalesce(
       CASE WHEN jsonb_typeof(roll.data->'total') = 'number'
         THEN (roll.data->>'total')::double precision END,
       0
     )
     OR roll.is_crit IS DISTINCT FROM CASE
       WHEN jsonb_typeof(roll.data->'isCrit') = 'boolean'
         THEN (roll.data->>'isCrit')::boolean END
     OR roll.is_crit_fail IS DISTINCT FROM CASE
       WHEN jsonb_typeof(roll.data->'isCritFail') = 'boolean'
         THEN (roll.data->>'isCritFail')::boolean END
     OR roll.crit_message IS DISTINCT FROM CASE
       WHEN jsonb_typeof(roll.data->'critMessage') = 'string'
         THEN roll.data->>'critMessage' END;

  IF v_count > 0 THEN
    RAISE EXCEPTION
      'campaign_rolls relational parity failed: % scalar mismatch(es), sample ids: %',
      v_count,
      v_samples;
  END IF;

  WITH expected AS (
    SELECT
      roll.id AS campaign_roll_id,
      die.ordinality::integer AS position,
      die.entry->>'type' AS die_type,
      (die.entry->>'value')::integer AS value,
      CASE WHEN jsonb_typeof(die.entry->'isMax') = 'boolean'
        THEN (die.entry->>'isMax')::boolean END AS is_max,
      CASE WHEN jsonb_typeof(die.entry->'isMin') = 'boolean'
        THEN (die.entry->>'isMin')::boolean END AS is_min
    FROM public.campaign_rolls roll
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE
        WHEN jsonb_typeof(roll.data->'dice') = 'array' THEN roll.data->'dice'
        ELSE '[]'::jsonb
      END
    ) WITH ORDINALITY AS die(entry, ordinality)
  ), differences AS (
    (SELECT * FROM expected
     EXCEPT
     SELECT campaign_roll_id, position, die_type, value, is_max, is_min
     FROM public.campaign_roll_dice)
    UNION ALL
    (SELECT campaign_roll_id, position, die_type, value, is_max, is_min
     FROM public.campaign_roll_dice
     EXCEPT
     SELECT * FROM expected)
  )
  SELECT count(*), (array_agg(DISTINCT campaign_roll_id ORDER BY campaign_roll_id))[1:10]
  INTO v_count, v_samples
  FROM differences;

  IF v_count > 0 THEN
    RAISE EXCEPTION
      'campaign_rolls relational parity failed: % dice mismatch(es), sample roll ids: %',
      v_count,
      v_samples;
  END IF;
END;
$parity$;

COMMIT;
