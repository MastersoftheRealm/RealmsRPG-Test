BEGIN;

SELECT plan(6);

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
VALUES ('pgtap-rel', '10000000-0000-4000-8000-000000000099', 'Rel', now() AT TIME ZONE 'UTC');

INSERT INTO public.character_inventory (
  character_id, inventory_row_id, category, position, source_kind, source_id, name_snapshot, quantity, equipped
) VALUES
  ('pgtap-rel', '80000000-0000-4000-8000-000000000001', 'equipment', 1, 'custom', 'bed-roll', 'Bed Roll', 1, false),
  ('pgtap-rel', '80000000-0000-4000-8000-000000000002', 'equipment', 2, 'custom', 'energy-potion', 'Energy Potion', 1, false);

SELECT lives_ok(
  $q$
    SELECT pgtap_patch_as_owner(
      'pgtap-rel', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object(
        'inventoryPatch', jsonb_build_object('ops', jsonb_build_array(
          jsonb_build_object(
            'op', 'update', 'bucket', 'items',
            'inventoryRowId', '80000000-0000-4000-8000-000000000001',
            'expected', jsonb_build_object(
              'quantity', 1, 'equipped', false, 'name', 'Bed Roll',
              'type', '', 'description', '', 'cost', null),
            'item', jsonb_build_object('quantity', 3)
          ),
          jsonb_build_object(
            'op', 'update', 'bucket', 'items',
            'inventoryRowId', '80000000-0000-4000-8000-000000000002',
            'expected', jsonb_build_object(
              'quantity', 1, 'equipped', false, 'name', 'Energy Potion',
              'type', '', 'description', '', 'cost', null),
            'item', jsonb_build_object('quantity', 2)
          )
        ))
      )
    );
  $q$,
  'patch_character_relational concurrent item updates via inventoryPatch'
);

SELECT results_eq(
  $$SELECT quantity::int FROM public.character_inventory
    WHERE inventory_row_id = '80000000-0000-4000-8000-000000000001'::uuid$$,
  ARRAY[3],
  'bed roll persisted via patch_character_relational'
);

SELECT lives_ok(
  $q$
    SELECT pgtap_patch_as_owner(
      'pgtap-rel', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object(
        'inventoryPatch', jsonb_build_object('ops', jsonb_build_array(
          jsonb_build_object('op', 'add', 'bucket', 'items', 'position', 3,
            'inventoryRowId', '80000000-0000-4000-8000-000000000003',
            'item', jsonb_build_object('id', 'custom-rope', 'name', 'Rope', 'quantity', 1))
        ))
      )
    );
  $q$,
  'patch_character_relational add item'
);

SELECT lives_ok(
  $q$
    SELECT pgtap_patch_as_owner(
      'pgtap-rel', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object(
        'inventoryPatch', jsonb_build_object('ops', jsonb_build_array(
          jsonb_build_object(
            'op', 'reorder', 'bucket', 'items',
            'inventoryRowId', '80000000-0000-4000-8000-000000000002',
            'expected', jsonb_build_object(
              'quantity', 2, 'equipped', false, 'name', 'Energy Potion',
              'type', '', 'description', '', 'cost', null),
            'position', 1
          )
        ))
      )
    );
  $q$,
  'patch_character_relational reorder item'
);

SELECT results_eq(
  $q$
    SELECT (pgtap_patch_as_owner(
      'pgtap-rel', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object(
        'inventoryPatch', jsonb_build_object('ops', jsonb_build_array(
          jsonb_build_object(
            'op', 'update', 'bucket', 'items',
            'inventoryRowId', '80000000-0000-4000-8000-000000000002',
            'expected', jsonb_build_object(
              'quantity', 99, 'equipped', false, 'name', 'Energy Potion',
              'type', '', 'description', '', 'cost', null),
            'item', jsonb_build_object('quantity', 5)
          )
        ))
      )
    )->>'status');
  $q$,
  ARRAY['conflict'],
  'patch_character_relational stale expected yields conflict'
);

SELECT lives_ok(
  $q$
    SELECT pgtap_patch_as_owner(
      'pgtap-rel', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object(
        'inventoryPatch', jsonb_build_object('ops', jsonb_build_array(
          jsonb_build_object(
            'op', 'remove', 'bucket', 'items',
            'inventoryRowId', '80000000-0000-4000-8000-000000000003',
            'expected', jsonb_build_object(
              'quantity', 1, 'equipped', false, 'name', 'Rope',
              'type', '', 'description', '', 'cost', null)
          )
        ))
      )
    );
  $q$,
  'patch_character_relational remove item'
);

SELECT * FROM finish();
ROLLBACK;