BEGIN;

SELECT plan(1);

CREATE OR REPLACE FUNCTION pgtap_patch_as_owner(
  p_character_id text,
  p_owner_id text,
  p_patch jsonb
)
RETURNS jsonb LANGUAGE plpgsql AS $fn$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_owner_id, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  RETURN public.patch_character_relational(p_character_id, p_patch, NULL);
END;
$fn$;

INSERT INTO public.characters (id, user_id, name, updated_at)
VALUES ('pgtap-char', '10000000-0000-4000-8000-000000000099', 'Before', now() AT TIME ZONE 'UTC');

SELECT pgtap_patch_as_owner(
  'pgtap-char',
  '10000000-0000-4000-8000-000000000099',
  jsonb_build_object(
    'equipment', jsonb_build_object(
      'items', jsonb_build_array(
        jsonb_build_object('id', 'custom-bed', 'name', 'Bed Roll', 'quantity', 1),
        jsonb_build_object('id', 'custom-energy', 'name', 'Energy Potion', 'quantity', 1)
      )
    )
  )
);

-- Tab A: Bed Roll quantity 3 (full equipment list).
SELECT pgtap_patch_as_owner(
  'pgtap-char',
  '10000000-0000-4000-8000-000000000099',
  jsonb_build_object(
    'equipment', jsonb_build_object(
      'items', jsonb_build_array(
        jsonb_build_object('id', 'custom-bed', 'name', 'Bed Roll', 'quantity', 3),
        jsonb_build_object('id', 'custom-energy', 'name', 'Energy Potion', 'quantity', 1)
      )
    )
  )
);

-- Tab B: stale Bed Roll qty 1 while updating Energy — LWW loses Tab A's Bed Roll change.
SELECT pgtap_patch_as_owner(
  'pgtap-char',
  '10000000-0000-4000-8000-000000000099',
  jsonb_build_object(
    'equipment', jsonb_build_object(
      'items', jsonb_build_array(
        jsonb_build_object('id', 'custom-bed', 'name', 'Bed Roll', 'quantity', 1),
        jsonb_build_object('id', 'custom-energy', 'name', 'Energy Potion', 'quantity', 2)
      )
    )
  )
);

SELECT results_eq(
  $$SELECT quantity::int FROM public.character_inventory
    WHERE character_id = 'pgtap-char' AND name_snapshot = 'Bed Roll'
    ORDER BY position LIMIT 1$$,
  ARRAY[3],
  'two-tab item edit: bed roll qty 3 must survive concurrent energy edit (CAS on branch)'
);

SELECT * FROM finish();
ROLLBACK;