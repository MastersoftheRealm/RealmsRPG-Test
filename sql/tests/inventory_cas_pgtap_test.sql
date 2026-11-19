BEGIN;

SELECT plan(23);

SELECT has_function('public', 'apply_character_inventory_patch', ARRAY['text','text','jsonb']);
SELECT has_function('public', 'patch_character_relational', ARRAY['text','jsonb','text']);

CREATE OR REPLACE FUNCTION pgtap_patch_as_owner(
  p_character_id text,
  p_owner_id text,
  p_patch jsonb
)
RETURNS jsonb LANGUAGE plpgsql AS $fn$
DECLARE
  v_prior text := current_setting('request.jwt.claim.sub', true);
BEGIN
  PERFORM set_config('request.jwt.claim.sub', p_owner_id, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  RETURN public.patch_character_relational(p_character_id, p_patch, NULL);
END;
$fn$;

INSERT INTO public.characters (id, user_id, updated_at) VALUES ('pgtap-char', '10000000-0000-4000-8000-000000000099', now() AT TIME ZONE 'UTC');

INSERT INTO public.character_inventory (
  character_id, inventory_row_id, category, position, source_kind, source_id, name_snapshot, quantity, equipped
) VALUES
  ('pgtap-char', '10000000-0000-4000-8000-000000000001', 'equipment', 1, 'custom', 'bed-roll', 'Bed Roll', 1, false),
  ('pgtap-char', '20000000-0000-4000-8000-000000000002', 'equipment', 2, 'custom', 'energy-potion', 'Energy Potion', 1, false);

SELECT throws_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-char', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object('ops', jsonb_build_array(
        jsonb_build_object(
          'op', 'update', 'bucket', 'items', 'inventoryRowId', '10000000-0000-4000-8000-000000000001',
          'expected', jsonb_build_object('quantity', 1, 'equipped', false, 'name', 'Bed Roll', 'type', '', 'description', '', 'cost', null),
          'item', jsonb_build_object('quantity', 3)
        ),
        jsonb_build_object(
          'op', 'update', 'bucket', 'items', 'inventoryRowId', '20000000-0000-4000-8000-000000000002',
          'expected', jsonb_build_object('quantity', 99, 'equipped', false, 'name', 'Energy Potion', 'type', '', 'description', '', 'cost', null),
          'item', jsonb_build_object('quantity', 2)
        )
      ))
    );
  $q$,
  '40001', 'inventory_cas_conflict'
);

SELECT results_eq(
  $$SELECT quantity::int FROM public.character_inventory WHERE inventory_row_id = '10000000-0000-4000-8000-000000000001'::uuid$$,
  ARRAY[1], 'all-or-nothing: bed roll unchanged'
);

SELECT lives_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-char', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object('ops', jsonb_build_array(
        jsonb_build_object('op', 'add', 'bucket', 'items', 'position', 3,
          'inventoryRowId', '30000000-0000-4000-8000-000000000003',
          'item', jsonb_build_object('id', 'custom-grapple-rope', 'name', 'Grapple Rope', 'quantity', 1))
      ))
    );
  $q$, 'add item with server row id'
);

SELECT results_eq(
  $$SELECT count(*)::int FROM public.character_inventory WHERE character_id = 'pgtap-char' AND name_snapshot = 'Grapple Rope'$$,
  ARRAY[1], 'add persisted'
);

SELECT lives_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-char', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object('ops', jsonb_build_array(
        jsonb_build_object(
          'op', 'update', 'bucket', 'items', 'inventoryRowId', '30000000-0000-4000-8000-000000000003',
          'expected', jsonb_build_object('quantity', 1, 'equipped', false, 'name', 'Grapple Rope', 'type', '', 'description', '', 'cost', null),
          'item', jsonb_build_object('type', null, 'description', null)
        )
      ))
    );
  $q$, 'clear type and description with null'
);

SELECT results_eq(
  $$SELECT coalesce(custom_type,'') FROM public.character_inventory WHERE inventory_row_id = '30000000-0000-4000-8000-000000000003'::uuid$$,
  ARRAY[''], 'type cleared'
);

SELECT results_eq(
  $$SELECT coalesce(custom_description,'') FROM public.character_inventory WHERE inventory_row_id = '30000000-0000-4000-8000-000000000003'::uuid$$,
  ARRAY[''], 'description cleared'
);

SELECT lives_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-char', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object('ops', jsonb_build_array(
        jsonb_build_object(
          'op', 'reorder', 'bucket', 'items', 'inventoryRowId', '20000000-0000-4000-8000-000000000002',
          'expected', jsonb_build_object(
            'quantity', 1, 'equipped', false, 'name', 'Energy Potion',
            'type', '', 'description', '', 'cost', null
          ),
          'position', 1
        )
      ))
    );
  $q$, 'reorder without PK violation'
);

SELECT results_eq(
  $q$
    SELECT (pgtap_patch_as_owner(
      'pgtap-char',
      '10000000-0000-4000-8000-000000000099',
      jsonb_build_object(
        'name', 'Renamed For Test',
        'equipment', jsonb_build_object('items', '[]'::jsonb)
      )
    )->>'status');
  $q$,
  ARRAY['conflict'],
  'legacy equipment key must not report success (non-silent rollout)'
);

SELECT results_eq(
  $q$
    SELECT name FROM public.characters WHERE id = 'pgtap-char';
  $q$,
  ARRAY['Renamed For Test'],
  'non-gear fields still persist when legacy equipment rejected'
);

SELECT lives_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-char', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object('ops', jsonb_build_array(
        jsonb_build_object(
          'op', 'remove', 'bucket', 'items', 'inventoryRowId', '30000000-0000-4000-8000-000000000003',
          'expected', jsonb_build_object(
            'quantity', 1, 'equipped', false, 'name', 'Grapple Rope',
            'type', '', 'description', '', 'cost', null
          )
        )
      ))
    );
  $q$, 'remove row'
);

INSERT INTO public.character_inventory (
  character_id, inventory_row_id, category, position, source_kind, source_id, name_snapshot, quantity, equipped
) VALUES
  ('pgtap-char', '40000000-0000-4000-8000-000000000004', 'armor', 1, 'custom', 'leather', 'Leather', 1, false);

SELECT lives_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-char', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object('ops', jsonb_build_array(
        jsonb_build_object(
          'op', 'update', 'bucket', 'armor', 'inventoryRowId', '40000000-0000-4000-8000-000000000004',
          'expected', jsonb_build_object('quantity', 1, 'equipped', false, 'name', 'Leather', 'type', '', 'description', '', 'cost', null),
          'item', jsonb_build_object('quantity', 2)
        )
      ))
    );
  $q$, 'update armor row with null slot'
);

SELECT results_eq(
  $$SELECT quantity::int FROM public.character_inventory WHERE inventory_row_id = '40000000-0000-4000-8000-000000000004'::uuid$$,
  ARRAY[2], 'armor quantity updated'
);

INSERT INTO public.character_inventory (
  character_id, inventory_row_id, category, position, source_kind, source_id, name_snapshot, quantity, equipped
) VALUES
  ('pgtap-char', '50000000-0000-4000-8000-000000000005', 'weapon', 1, 'custom', 'w1', 'A', 1, false),
  ('pgtap-char', '50000000-0000-4000-8000-000000000006', 'weapon', 2, 'custom', 'w2', 'B', 1, false),
  ('pgtap-char', '50000000-0000-4000-8000-000000000007', 'weapon', 3, 'custom', 'w3', 'C', 1, false);

SELECT lives_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-char', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object('ops', jsonb_build_array(
        jsonb_build_object(
          'op', 'remove', 'bucket', 'weapons', 'inventoryRowId', '50000000-0000-4000-8000-000000000006',
          'expected', jsonb_build_object('quantity', 1, 'equipped', false, 'name', 'B', 'type', '', 'description', '', 'cost', null)
        ),
        jsonb_build_object('op', 'add', 'bucket', 'weapons', 'position', 3,
          'inventoryRowId', '50000000-0000-4000-8000-000000000008',
          'item', jsonb_build_object('id', 'w4', 'name', 'D', 'quantity', 1))
      ))
    );
  $q$, 'add at occupied position after middle remove'
);

SELECT results_eq(
  $$SELECT count(*)::int FROM public.character_inventory WHERE character_id = 'pgtap-char' AND category = 'weapon' AND name_snapshot = 'D'$$,
  ARRAY[1], 'add at tail position persisted'
);

DELETE FROM public.character_inventory
WHERE character_id = 'pgtap-char' AND category = 'weapon';

INSERT INTO public.character_inventory (
  character_id, inventory_row_id, category, position, source_kind, source_id, name_snapshot, quantity, equipped
) VALUES
  ('pgtap-char', '60000000-0000-4000-8000-000000000009', 'weapon', 1, 'custom', 'w1', 'One', 1, false),
  ('pgtap-char', '60000000-0000-4000-8000-00000000000a', 'weapon', 2, 'custom', 'w2', 'Two', 1, false),
  ('pgtap-char', '60000000-0000-4000-8000-00000000000b', 'weapon', 3, 'custom', 'w3', 'Three', 1, false);

SELECT lives_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-char', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object('ops', jsonb_build_array(
        jsonb_build_object('op', 'add', 'bucket', 'weapons', 'position', 1,
          'inventoryRowId', '60000000-0000-4000-8000-00000000000c',
          'item', jsonb_build_object('id', 'w0', 'name', 'Zero', 'quantity', 1))
      ))
    );
  $q$, 'add at front of dense three-weapon list'
);

SELECT results_eq(
  $$SELECT count(*)::int FROM public.character_inventory WHERE character_id = 'pgtap-char' AND category = 'weapon'$$,
  ARRAY[4], 'dense add keeps four weapons'
);

DELETE FROM public.character_inventory
WHERE character_id = 'pgtap-char' AND category = 'weapon';

INSERT INTO public.character_inventory (
  character_id, inventory_row_id, category, position, source_kind, source_id, name_snapshot, quantity, equipped
) VALUES
  ('pgtap-char', '70000000-0000-4000-8000-00000000000d', 'weapon', 1, 'custom', 'r1', 'Alpha', 1, false),
  ('pgtap-char', '70000000-0000-4000-8000-00000000000e', 'weapon', 2, 'custom', 'r2', 'Beta', 1, false),
  ('pgtap-char', '70000000-0000-4000-8000-00000000000f', 'weapon', 3, 'custom', 'r3', 'Gamma', 1, false);

SELECT lives_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-char', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object('ops', jsonb_build_array(
        jsonb_build_object(
          'op', 'reorder', 'bucket', 'weapons', 'inventoryRowId', '70000000-0000-4000-8000-00000000000f',
          'expected', jsonb_build_object('quantity', 1, 'equipped', false, 'name', 'Gamma', 'type', '', 'description', '', 'cost', null),
          'position', 1
        )
      ))
    );
  $q$, 'reorder last weapon to front in dense list'
);

SELECT results_eq(
  $$SELECT count(*)::int FROM public.character_inventory WHERE character_id = 'pgtap-char' AND category = 'weapon'$$,
  ARRAY[3], 'reorder dense list keeps three weapons'
);

DELETE FROM public.character_inventory
WHERE character_id = 'pgtap-char' AND category = 'weapon';

INSERT INTO public.character_inventory (
  character_id, inventory_row_id, category, position, source_kind, source_id, name_snapshot, quantity, equipped
) VALUES
  ('pgtap-char', '70000000-0000-4000-8000-00000000000d', 'weapon', 1, 'custom', 'r1', 'Alpha', 1, false),
  ('pgtap-char', '70000000-0000-4000-8000-00000000000e', 'weapon', 2, 'custom', 'r2', 'Beta', 1, false),
  ('pgtap-char', '70000000-0000-4000-8000-00000000000f', 'weapon', 3, 'custom', 'r3', 'Gamma', 1, false);

SELECT lives_ok(
  $q$
    SELECT public.apply_character_inventory_patch(
      'pgtap-char', '10000000-0000-4000-8000-000000000099',
      jsonb_build_object('ops', jsonb_build_array(
        jsonb_build_object(
          'op', 'reorder', 'bucket', 'weapons', 'inventoryRowId', '70000000-0000-4000-8000-00000000000e',
          'expected', jsonb_build_object('quantity', 1, 'equipped', false, 'name', 'Beta', 'type', '', 'description', '', 'cost', null),
          'position', 1
        ),
        jsonb_build_object(
          'op', 'reorder', 'bucket', 'weapons', 'inventoryRowId', '70000000-0000-4000-8000-00000000000f',
          'expected', jsonb_build_object('quantity', 1, 'equipped', false, 'name', 'Gamma', 'type', '', 'description', '', 'cost', null),
          'position', 2
        ),
        jsonb_build_object(
          'op', 'reorder', 'bucket', 'weapons', 'inventoryRowId', '70000000-0000-4000-8000-00000000000d',
          'expected', jsonb_build_object('quantity', 1, 'equipped', false, 'name', 'Alpha', 'type', '', 'description', '', 'cost', null),
          'position', 3
        )
      ))
    );
  $q$, 'multi-step reorder alpha to end'
);

SELECT results_eq(
  $q$
    SELECT array_agg(name_snapshot ORDER BY position)
    FROM public.character_inventory
    WHERE character_id = 'pgtap-char' AND category = 'weapon';
  $q$,
  $$SELECT ARRAY['Beta','Gamma','Alpha']::text[]$$,
  'multi-step reorder ends Beta, Gamma, Alpha'
);

SELECT * FROM finish();
ROLLBACK;