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

INSERT INTO public.characters (id, user_id, name, updated_at) VALUES ('pgtap-char', 'pgtap-owner', 'Before', now() AT TIME ZONE 'UTC');

SELECT results_eq(
  $q$
    SELECT (pgtap_patch_as_owner(
      'pgtap-char',
      'pgtap-owner',
      jsonb_build_object(
        'name', 'Renamed',
        'equipment', jsonb_build_object('items', jsonb_build_array(jsonb_build_object('id','rope','name','Rope','quantity',2)))
      )
    )->>'status');
  $q$,
  ARRAY['conflict'],
  'legacy equipment must not report plain updated (silent gear drop)'
);

SELECT * FROM finish();
ROLLBACK;