BEGIN;

SELECT plan(3);

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
VALUES ('pgtap-lib', '10000000-0000-4000-8000-000000000099', 'Lib', now() AT TIME ZONE 'UTC');

INSERT INTO public.character_inventory (
  character_id, inventory_row_id, category, position, source_kind, source_id, name_snapshot, quantity, equipped
) VALUES
  ('pgtap-lib', '80000000-0000-4000-8000-000000000010', 'equipment', 1, 'custom', 'health-potion', 'Health Potion', 2, false);

SELECT lives_ok(
  $q$
    SELECT pgtap_patch_as_owner(
      'pgtap-lib', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object(
        'inventoryPatch', jsonb_build_object('ops', jsonb_build_array(
          jsonb_build_object(
            'op', 'add', 'bucket', 'weapons', 'position', 1,
            'inventoryRowId', '80000000-0000-4000-8000-000000000011',
            'item', jsonb_build_object('id', 'lib-knife', 'name', 'Knife', 'quantity', 1, 'equipped', false)
          )
        ))
      )
    );
  $q$,
  'library-style weapon add (no custom_type)'
);

SELECT is(
  public.inventory_row_cas_snapshot(i)::text,
  '{"quantity": 1, "equipped": false, "name": "Knife", "type": "", "description": "", "cost": null}',
  'server CAS snapshot after library weapon add'
)
FROM public.character_inventory i
WHERE i.inventory_row_id = '80000000-0000-4000-8000-000000000011'::uuid;

SELECT lives_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-lib',
      '10000000-0000-4000-8000-000000000099',
      jsonb_build_object('ops', jsonb_build_array(
        jsonb_build_object(
          'op', 'remove', 'bucket', 'weapons',
          'inventoryRowId', '80000000-0000-4000-8000-000000000011',
          'expected', jsonb_build_object(
            'quantity', 1, 'equipped', false, 'name', 'Knife',
            'type', '', 'description', '', 'cost', null)
        )
      ))
    );
  $q$,
  'remove with client-matching expected CAS succeeds'
);

SELECT * FROM finish();
ROLLBACK;