-- Transactional smoke test for the campaign-roll relational contract.
-- Run only after campaign-rolls-relational-contract.sql. Fixtures roll back.

BEGIN;

DO $tests$
DECLARE
  v_campaign_id text;
  v_character_id text;
  v_character_name text;
  v_user_id text;
  v_roll_id text := 'campaign-roll-relational-contract-test';
  v_created_at timestamp(3) without time zone;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'campaign_rolls'
      AND column_name = 'data'
  ) THEN
    RAISE EXCEPTION 'Legacy campaign_rolls.data column still exists';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgrelid = 'public.campaign_rolls'::regclass
      AND tgname IN (
        'campaign_rolls_relational_parent_sync',
        'campaign_rolls_relational_dice_sync'
      )
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'Legacy campaign roll compatibility trigger still exists';
  END IF;

  SELECT
    campaign.id,
    roster.entry->>'characterId',
    coalesce(nullif(roster.entry->>'characterName', ''), 'Contract Test Hero'),
    roster.entry->>'userId'
  INTO v_campaign_id, v_character_id, v_character_name, v_user_id
  FROM public.campaigns campaign
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE
      WHEN jsonb_typeof(campaign.characters) = 'array' THEN campaign.characters
      ELSE '[]'::jsonb
    END
  ) roster(entry)
  WHERE nullif(roster.entry->>'characterId', '') IS NOT NULL
    AND nullif(roster.entry->>'userId', '') IS NOT NULL
  ORDER BY campaign.id, roster.entry->>'characterId'
  LIMIT 1;

  IF v_campaign_id IS NULL OR v_character_id IS NULL OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'Contract smoke test requires one attributed campaign character';
  END IF;

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', v_user_id, 'role', 'authenticated')::text,
    true
  );
  SET LOCAL ROLE authenticated;

  PERFORM public.create_campaign_roll_relational(
    v_roll_id,
    v_campaign_id,
    v_character_id,
    v_character_name,
    v_user_id,
    '2030-01-02T03:04:05.678Z'::timestamp with time zone,
    false,
    'skill',
    'Contract Test Roll',
    4,
    'Strength',
    27,
    true,
    false,
    'Natural 20! +2 to the total!',
    ARRAY['d20', 'd6']::text[],
    ARRAY[20, 1]::integer[],
    ARRAY[true, false]::boolean[],
    ARRAY[false, true]::boolean[]
  );

  SELECT created_at
  INTO v_created_at
  FROM public.campaign_rolls
  WHERE id = v_roll_id
    AND campaign_id = v_campaign_id
    AND character_id = v_character_id
    AND character_name = v_character_name
    AND user_id = v_user_id
    AND type = 'skill'
    AND title = 'Contract Test Roll'
    AND rolled_at = '2030-01-02T03:04:05.678Z'::timestamp with time zone
    AND rolled_by_realm_master = false
    AND modifier = 4
    AND modifier_label = 'Strength'
    AND total = 27
    AND is_crit = true
    AND is_crit_fail = false
    AND crit_message = 'Natural 20! +2 to the total!';

  IF v_created_at IS DISTINCT FROM '2030-01-02T03:04:05.678'::timestamp THEN
    RAISE EXCEPTION 'Relational campaign roll parent did not round trip';
  END IF;

  IF EXISTS (
    (VALUES
      (v_roll_id, 1, 'd20', 20, true, false),
      (v_roll_id, 2, 'd6', 1, false, true)
    )
    EXCEPT
    SELECT campaign_roll_id, position, die_type, value, is_max, is_min
    FROM public.campaign_roll_dice
    WHERE campaign_roll_id = v_roll_id
  ) OR EXISTS (
    SELECT campaign_roll_id, position, die_type, value, is_max, is_min
    FROM public.campaign_roll_dice
    WHERE campaign_roll_id = v_roll_id
    EXCEPT
    VALUES
      (v_roll_id, 1, 'd20', 20, true, false),
      (v_roll_id, 2, 'd6', 1, false, true)
  ) THEN
    RAISE EXCEPTION 'Relational campaign roll dice did not round trip in order';
  END IF;

  BEGIN
    PERFORM public.create_campaign_roll_relational(
      v_roll_id || '-invalid',
      v_campaign_id,
      v_character_id,
      v_character_name,
      v_user_id,
      '2030-01-02T03:04:05.678Z'::timestamp with time zone,
      false,
      'skill',
      'Invalid Dice Arrays',
      0,
      NULL,
      3,
      false,
      false,
      NULL,
      ARRAY['d6', 'd6']::text[],
      ARRAY[3]::integer[],
      ARRAY[false, false]::boolean[],
      ARRAY[false, false]::boolean[]
    );
    RAISE EXCEPTION 'Mismatched dice arrays were accepted';
  EXCEPTION
    WHEN array_subscript_error THEN
      NULL;
  END;

  IF EXISTS (
    SELECT 1 FROM public.campaign_rolls WHERE id = v_roll_id || '-invalid'
  ) THEN
    RAISE EXCEPTION 'Invalid relational campaign roll partially saved';
  END IF;
END;
$tests$;

ROLLBACK;
