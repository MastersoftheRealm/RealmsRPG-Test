-- Transactional smoke test for the campaign-roll compatibility expansion.
-- Run only after campaign-rolls-relational-expand.sql. Fixtures roll back.

BEGIN;

DO $tests$
DECLARE
  v_campaign_id text;
  v_character_id text;
  v_character_name text;
  v_user_id text;
  v_roll_id text := 'campaign-roll-relational-expand-test';
  v_data jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'campaign_rolls'
      AND column_name = 'data'
  ) THEN
    RAISE EXCEPTION 'Compatibility expansion requires campaign_rolls.data';
  END IF;

  SELECT
    campaign.id,
    roster.entry->>'characterId',
    coalesce(nullif(roster.entry->>'characterName', ''), 'Expand Test Hero'),
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
    RAISE EXCEPTION 'Expansion smoke test requires one attributed campaign character';
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
    'Expand Test Roll',
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

  SELECT data
  INTO v_data
  FROM public.campaign_rolls
  WHERE id = v_roll_id
    AND character_id = v_character_id
    AND character_name = v_character_name
    AND user_id = v_user_id
    AND type = 'skill'
    AND title = 'Expand Test Roll'
    AND modifier = 4
    AND modifier_label = 'Strength'
    AND total = 27
    AND is_crit = true
    AND is_crit_fail = false;

  IF v_data IS NULL
     OR v_data->>'characterName' <> v_character_name
     OR v_data->>'total' <> '27'
     OR jsonb_array_length(v_data->'dice') <> 2 THEN
    RAISE EXCEPTION 'Compatibility RPC did not preserve the rollback mirror';
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
  ) THEN
    RAISE EXCEPTION 'Compatibility RPC did not project ordered dice';
  END IF;
END;
$tests$;

ROLLBACK;
