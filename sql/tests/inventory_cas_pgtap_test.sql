BEGIN;

SELECT plan(9);

SELECT has_function('public', 'apply_character_inventory_patch', ARRAY['text','text','jsonb']);

INSERT INTO public.characters (id, user_id) VALUES ('pgtap-char', 'pgtap-owner');

INSERT INTO public.character_inventory (
  character_id, inventory_row_id, category, position, source_kind, source_id, name_snapshot, quantity, equipped
) VALUES
  ('pgtap-char', '10000000-0000-4000-8000-000000000001', 'equipment', 1, 'custom', 'health-potion', 'Health Potion', 1, false),
  ('pgtap-char', '20000000-0000-4000-8000-000000000002', 'equipment', 2, 'custom', 'energy-potion', 'Energy Potion', 1, false);

SELECT throws_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-char',
      'pgtap-owner',
      jsonb_build_object(
        'ops', jsonb_build_array(
          jsonb_build_object(
            'op', 'update',
            'bucket', 'items',
            'inventoryRowId', '10000000-0000-4000-8000-000000000001',
            'expected', jsonb_build_object(
              'quantity', 1, 'equipped', false, 'name', 'Health Potion',
              'type', '', 'description', '', 'cost', null
            ),
            'item', jsonb_build_object('quantity', 3)
          ),
          jsonb_build_object(
            'op', 'update',
            'bucket', 'items',
            'inventoryRowId', '20000000-0000-4000-8000-000000000002',
            'expected', jsonb_build_object(
              'quantity', 99, 'equipped', false, 'name', 'Energy Potion',
              'type', '', 'description', '', 'cost', null
            ),
            'item', jsonb_build_object('quantity', 2)
          )
        )
      )
    );
  $q$,
  '40001',
  'inventory_cas_conflict'
);

SELECT results_eq(
  $$SELECT quantity::int FROM public.character_inventory WHERE inventory_row_id = '10000000-0000-4000-8000-000000000001'::uuid$$,
  ARRAY[1],
  'health quantity unchanged after failed patch'
);

SELECT results_eq(
  $$SELECT quantity::int FROM public.character_inventory WHERE inventory_row_id = '20000000-0000-4000-8000-000000000002'::uuid$$,
  ARRAY[1],
  'energy quantity unchanged after failed patch'
);

SELECT lives_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-char',
      'pgtap-owner',
      jsonb_build_object(
        'ops', jsonb_build_array(
          jsonb_build_object(
            'op', 'update',
            'bucket', 'items',
            'inventoryRowId', '10000000-0000-4000-8000-000000000001',
            'expected', jsonb_build_object(
              'quantity', 1, 'equipped', false, 'name', 'Health Potion',
              'type', '', 'description', '', 'cost', null
            ),
            'item', jsonb_build_object('quantity', 3)
          )
        )
      )
    );
  $q$,
  'valid single-row update applies'
);

SELECT results_eq(
  $$SELECT quantity::int FROM public.character_inventory WHERE inventory_row_id = '10000000-0000-4000-8000-000000000001'::uuid$$,
  ARRAY[3],
  'health quantity updated'
);

SELECT results_eq(
  $$SELECT quantity::int FROM public.character_inventory WHERE inventory_row_id = '20000000-0000-4000-8000-000000000002'::uuid$$,
  ARRAY[1],
  'energy quantity still untouched (two-tab)'
);

UPDATE public.character_inventory
SET equipped = true WHERE inventory_row_id = '20000000-0000-4000-8000-000000000002'::uuid;

SELECT lives_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-char',
      'pgtap-owner',
      jsonb_build_object(
        'ops', jsonb_build_array(
          jsonb_build_object(
            'op', 'update',
            'bucket', 'items',
            'inventoryRowId', '20000000-0000-4000-8000-000000000002',
            'expected', jsonb_build_object(
              'quantity', 1, 'equipped', true, 'name', 'Energy Potion',
              'type', '', 'description', '', 'cost', null
            ),
            'item', jsonb_build_object('quantity', 2)
          )
        )
      )
    );
  $q$,
  'quantity-only item patch omits equipped and preserves true'
);

SELECT results_eq(
  $$SELECT equipped FROM public.character_inventory WHERE inventory_row_id = '20000000-0000-4000-8000-000000000002'::uuid$$,
  ARRAY[true],
  'equipped not forced false when omitted on update'
);

SELECT * FROM finish();
ROLLBACK;