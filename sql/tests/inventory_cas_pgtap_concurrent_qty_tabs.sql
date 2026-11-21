BEGIN;

SELECT plan(6);

CREATE OR REPLACE FUNCTION pgtap_patch_as_owner(
  p_character_id text,
  p_owner_id text,
  p_patch jsonb,
  p_updated_at text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql AS $fn$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_owner_id, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  RETURN public.patch_character_relational(p_character_id, p_patch, p_updated_at);
END;
$fn$;

INSERT INTO public.characters (id, user_id, name, updated_at)
VALUES (
  'pgtap-c2',
  '10000000-0000-4000-8000-000000000099',
  'C2',
  '2026-01-01T00:00:00.000Z'::timestamptz
);

INSERT INTO public.character_inventory (
  character_id, inventory_row_id, category, position, source_kind, source_id, name_snapshot, quantity, equipped
) VALUES (
  'pgtap-c2',
  '10000000-0000-4000-8000-000000000001',
  'equipment',
  1,
  'custom',
  'health-potion',
  'Health Potion',
  2,
  false
);

SELECT lives_ok(
  $q$
    SELECT pgtap_patch_as_owner(
      'pgtap-c2',
      '10000000-0000-4000-8000-000000000099',
      jsonb_build_object(
        'inventoryPatch', jsonb_build_object('ops', jsonb_build_array(
          jsonb_build_object(
            'op', 'update', 'bucket', 'items',
            'inventoryRowId', '10000000-0000-4000-8000-000000000001',
            'expected', jsonb_build_object(
              'quantity', 2, 'equipped', false, 'name', 'Health Potion',
              'type', '', 'description', '', 'cost', null),
            'item', jsonb_build_object('quantity', 3)
          )
        ))
      ),
      '2026-01-01T00:00:00.000Z'
    );
  $q$,
  'tab A +1 persists with matching document lock and CAS'
);

SELECT results_eq(
  $$SELECT quantity::int FROM public.character_inventory
    WHERE inventory_row_id = '10000000-0000-4000-8000-000000000001'::uuid$$,
  ARRAY[3],
  'row quantity is 3 after tab A'
);

SELECT is(
  (
    SELECT pgtap_patch_as_owner(
      'pgtap-c2',
      '10000000-0000-4000-8000-000000000099',
      jsonb_build_object(
        'inventoryPatch', jsonb_build_object('ops', jsonb_build_array(
          jsonb_build_object(
            'op', 'update', 'bucket', 'items',
            'inventoryRowId', '10000000-0000-4000-8000-000000000001',
            'expected', jsonb_build_object(
              'quantity', 2, 'equipped', false, 'name', 'Health Potion',
              'type', '', 'description', '', 'cost', null),
            'item', jsonb_build_object('quantity', 1)
          )
        ))
      ),
      '2026-01-01T00:00:00.000Z'
    )->>'status'
  ),
  'conflict',
  'stale document lock rejects tab B last-write-wins qty 1'
);

SELECT results_eq(
  $$SELECT quantity::int FROM public.character_inventory
    WHERE inventory_row_id = '10000000-0000-4000-8000-000000000001'::uuid$$,
  ARRAY[3],
  'qty unchanged after rejected tab B patch'
);

SELECT lives_ok(
  $q$
    SELECT pgtap_patch_as_owner(
      'pgtap-c2',
      '10000000-0000-4000-8000-000000000099',
      jsonb_build_object(
        'inventoryPatch', jsonb_build_object('ops', jsonb_build_array(
          jsonb_build_object(
            'op', 'update', 'bucket', 'items',
            'inventoryRowId', '10000000-0000-4000-8000-000000000001',
            'expected', jsonb_build_object(
              'quantity', 3, 'equipped', false, 'name', 'Health Potion',
              'type', '', 'description', '', 'cost', null),
            'item', jsonb_build_object('quantity', 2)
          )
        ))
      ),
      (SELECT updated_at::text FROM public.characters WHERE id = 'pgtap-c2')
    );
  $q$,
  'tab B merged -1 on tab A value yields qty 2'
);

SELECT results_eq(
  $$SELECT quantity::int FROM public.character_inventory
    WHERE inventory_row_id = '10000000-0000-4000-8000-000000000001'::uuid$$,
  ARRAY[2],
  'merged concurrent qty edits persist as 2 not 1'
);

SELECT * FROM finish();

ROLLBACK;