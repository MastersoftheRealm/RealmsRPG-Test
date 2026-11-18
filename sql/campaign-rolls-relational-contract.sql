-- Campaign rolls: final relational contract migration.
-- Apply after campaign-rolls-relational-expand.sql, relational application QA,
-- explicit approval, and a fresh backup. The parity guard runs before the
-- legacy JSONB column and compatibility functions are removed atomically.

BEGIN;

LOCK TABLE public.campaign_rolls IN ACCESS EXCLUSIVE MODE;
LOCK TABLE public.campaign_roll_dice IN SHARE ROW EXCLUSIVE MODE;

DO $parity_guard$
DECLARE
  v_count bigint;
  v_samples text[];
BEGIN
  SELECT count(*), (array_agg(roll.id ORDER BY roll.id))[1:10]
  INTO v_count, v_samples
  FROM public.campaign_rolls roll
  WHERE roll.character_id IS DISTINCT FROM roll.data->>'characterId'
     OR roll.character_name IS DISTINCT FROM roll.data->>'characterName'
     OR roll.user_id IS DISTINCT FROM roll.data->>'userId'
     OR roll.type IS DISTINCT FROM roll.data->>'type'
     OR roll.title IS DISTINCT FROM roll.data->>'title'
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
      'campaign_rolls contract refused: % scalar mismatch(es), sample ids: %',
      v_count,
      v_samples
      USING ERRCODE = 'check_violation';
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
      'campaign_rolls contract refused: % dice mismatch(es), sample roll ids: %',
      v_count,
      v_samples
      USING ERRCODE = 'check_violation';
  END IF;
END;
$parity_guard$;

DROP TRIGGER IF EXISTS campaign_rolls_relational_parent_sync
  ON public.campaign_rolls;
DROP TRIGGER IF EXISTS campaign_rolls_relational_dice_sync
  ON public.campaign_rolls;

DROP FUNCTION IF EXISTS private.sync_campaign_roll_parent_from_data();
DROP FUNCTION IF EXISTS private.sync_campaign_roll_dice_from_data();
DROP FUNCTION IF EXISTS private.campaign_roll_effective_rm(text, text, text, jsonb);
DROP FUNCTION IF EXISTS private.campaign_roll_payload_issue(jsonb);
DROP FUNCTION IF EXISTS private.campaign_roll_payload_rolled_at(jsonb);

ALTER TABLE public.campaign_rolls DROP COLUMN data;

GRANT SELECT ON public.campaign_rolls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_rolls TO service_role;
REVOKE ALL ON public.campaign_rolls FROM anon;

-- Insert the parent roll and every ordered die in one transaction. Array
-- arguments keep the write contract relational without introducing a generic
-- document parameter or a second partial-write path.
CREATE OR REPLACE FUNCTION public.create_campaign_roll_relational(
  p_id text,
  p_campaign_id text,
  p_character_id text,
  p_character_name text,
  p_user_id text,
  p_rolled_at timestamp with time zone,
  p_rolled_by_realm_master boolean,
  p_type text,
  p_title text,
  p_modifier double precision,
  p_modifier_label text,
  p_total double precision,
  p_is_crit boolean,
  p_is_crit_fail boolean,
  p_crit_message text,
  p_die_types text[],
  p_die_values integer[],
  p_die_is_max boolean[],
  p_die_is_min boolean[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_actor_id text := (SELECT auth.uid())::text;
  v_campaign_owner_id text;
  v_dice_count integer;
  v_roster_character_name text;
  v_roster_user_id text;
BEGIN
  IF nullif(p_id, '') IS NULL
     OR nullif(p_campaign_id, '') IS NULL
     OR nullif(p_character_id, '') IS NULL
     OR nullif(p_character_name, '') IS NULL
     OR nullif(p_user_id, '') IS NULL
     OR nullif(p_title, '') IS NULL
     OR p_rolled_at IS NULL THEN
    RAISE EXCEPTION 'campaign roll requires all identity, title, and timestamp values'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_type NOT IN ('attack', 'damage', 'skill', 'ability', 'defense', 'custom') THEN
    RAISE EXCEPTION 'campaign roll type is not recognized'
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_actor_id IS NULL OR p_user_id IS DISTINCT FROM v_actor_id THEN
    RAISE EXCEPTION 'campaign roll author must match the authenticated user'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT
    campaign.owner_id,
    nullif(roster.entry->>'characterName', ''),
    nullif(roster.entry->>'userId', '')
  INTO v_campaign_owner_id, v_roster_character_name, v_roster_user_id
  FROM public.campaigns campaign
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(campaign.characters) = 'array' THEN campaign.characters
      ELSE '[]'::jsonb
    END
  ) roster(entry)
  WHERE campaign.id = p_campaign_id
    AND roster.entry->>'characterId' = p_character_id
    AND (
      campaign.owner_id = v_actor_id
      OR roster.entry->>'userId' = v_actor_id
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'authenticated user cannot roll for this campaign character'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  p_character_name := coalesce(v_roster_character_name, p_character_name);
  p_rolled_by_realm_master := (
    v_campaign_owner_id = v_actor_id
    AND v_roster_user_id IS NOT NULL
    AND v_roster_user_id <> v_campaign_owner_id
  );

  IF p_die_types IS NULL
     OR p_die_values IS NULL
     OR p_die_is_max IS NULL
     OR p_die_is_min IS NULL THEN
    RAISE EXCEPTION 'campaign roll dice arrays cannot be null'
      USING ERRCODE = 'null_value_not_allowed';
  END IF;

  v_dice_count := cardinality(p_die_types);
  IF cardinality(p_die_values) <> v_dice_count
     OR cardinality(p_die_is_max) <> v_dice_count
     OR cardinality(p_die_is_min) <> v_dice_count THEN
    RAISE EXCEPTION 'campaign roll dice arrays must have equal lengths'
      USING ERRCODE = 'array_subscript_error';
  END IF;

  INSERT INTO public.campaign_rolls (
    id,
    campaign_id,
    character_id,
    character_name,
    user_id,
    type,
    title,
    rolled_at,
    rolled_by_realm_master,
    modifier,
    modifier_label,
    total,
    is_crit,
    is_crit_fail,
    crit_message,
    created_at
  ) VALUES (
    p_id,
    p_campaign_id,
    p_character_id,
    p_character_name,
    p_user_id,
    p_type,
    p_title,
    p_rolled_at,
    p_rolled_by_realm_master,
    p_modifier,
    p_modifier_label,
    p_total,
    p_is_crit,
    p_is_crit_fail,
    p_crit_message,
    (p_rolled_at AT TIME ZONE 'UTC')::timestamp(3) without time zone
  );

  INSERT INTO public.campaign_roll_dice (
    campaign_roll_id,
    position,
    die_type,
    value,
    is_max,
    is_min
  )
  SELECT
    p_id,
    die.position::integer,
    die.die_type,
    die.value,
    die.is_max,
    die.is_min
  FROM unnest(p_die_types, p_die_values, p_die_is_max, p_die_is_min)
    WITH ORDINALITY AS die(die_type, value, is_max, is_min, position);
END;
$function$;

REVOKE ALL ON FUNCTION public.create_campaign_roll_relational(
  text, text, text, text, text, timestamp with time zone, boolean, text, text,
  double precision, text, double precision, boolean, boolean, text,
  text[], integer[], boolean[], boolean[]
) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.create_campaign_roll_relational(
  text, text, text, text, text, timestamp with time zone, boolean, text, text,
  double precision, text, double precision, boolean, boolean, text,
  text[], integer[], boolean[], boolean[]
) TO authenticated;

COMMIT;
