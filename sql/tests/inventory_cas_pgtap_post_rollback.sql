BEGIN;

SELECT plan(2);

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
VALUES ('pgtap-rollback', '10000000-0000-4000-8000-000000000099', 'Rollback', now() AT TIME ZONE 'UTC');

SELECT lives_ok(
  $q$
    SELECT pgtap_patch_as_owner(
      'pgtap-rollback',
      '10000000-0000-4000-8000-000000000099',
      jsonb_build_object(
        'equipment', jsonb_build_object(
          'items', jsonb_build_array(
            jsonb_build_object('id', 'custom-rope', 'name', 'Rope', 'quantity', 1)
          )
        )
      )
    );
  $q$,
  'patch_character_relational equipment save after full rollback'
);

SELECT results_eq(
  $$SELECT count(*)::int FROM public.character_inventory WHERE character_id = 'pgtap-rollback' AND name_snapshot = 'Rope'$$,
  ARRAY[1],
  'rope row persisted without inventory_row_id column'
);

SELECT * FROM finish();
ROLLBACK;