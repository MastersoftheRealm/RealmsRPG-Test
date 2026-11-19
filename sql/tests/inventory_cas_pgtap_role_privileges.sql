-- Role ACL smoke: anon/authenticated vs inventory CAS entrypoints (not JWT-only helpers).
BEGIN;

SELECT plan(6);

INSERT INTO public.characters (id, user_id, updated_at)
VALUES ('pgtap-role-char', '10000000-0000-4000-8000-0000000000aa', now() AT TIME ZONE 'UTC');

INSERT INTO public.character_inventory (
  character_id, inventory_row_id, category, position, source_kind, source_id, name_snapshot, quantity, equipped
) VALUES (
  'pgtap-role-char', '10000000-0000-4000-8000-0000000000b1', 'equipment', 1, 'custom', 'bed-roll', 'Bed Roll', 1, false
);

SELECT throws_ok(
  $q$
    DO $do$
    BEGIN
      SET LOCAL ROLE anon;
      PERFORM public.apply_character_inventory_patch(
        'pgtap-role-char', '10000000-0000-4000-8000-0000000000aa',
        jsonb_build_object('ops', '[]'::jsonb)
      );
    END;
    $do$;
  $q$,
  '42501', NULL, 'anon cannot EXECUTE apply_character_inventory_patch'
);

SELECT throws_ok(
  $q$
    DO $do$
    BEGIN
      SET LOCAL ROLE anon;
      PERFORM public.inventory_patch_bucket_category('weapons');
    END;
    $do$;
  $q$,
  '42501', NULL, 'anon cannot EXECUTE inventory_patch_bucket_category'
);

SELECT throws_ok(
  $q$
    DO $do$
    BEGIN
      SET LOCAL ROLE anon;
      PERFORM public.inventory_row_cas_snapshot(i)
      FROM public.character_inventory i
      WHERE i.inventory_row_id = '10000000-0000-4000-8000-0000000000b1'::uuid
      LIMIT 1;
    END;
    $do$;
  $q$,
  '42501', NULL, 'anon cannot EXECUTE inventory_row_cas_snapshot'
);

SELECT throws_ok(
  $q$
    DO $do$
    BEGIN
      SET LOCAL ROLE anon;
      PERFORM public.inventory_patch_field_clear('{}'::jsonb, 'type');
    END;
    $do$;
  $q$,
  '42501', NULL, 'anon cannot EXECUTE inventory_patch_field_clear'
);

SELECT lives_ok(
  $q$
    DO $do$
    DECLARE v jsonb;
    BEGIN
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-0000000000aa', true);
      PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
      v := public.patch_character_relational(
        'pgtap-role-char',
        jsonb_build_object(
          'inventoryPatch', jsonb_build_object('ops', jsonb_build_array(
            jsonb_build_object(
              'op', 'update', 'bucket', 'items', 'inventoryRowId', '10000000-0000-4000-8000-0000000000b1',
              'expected', jsonb_build_object(
                'quantity', 1, 'equipped', false, 'name', 'Bed Roll', 'type', '', 'description', '', 'cost', null
              ),
              'item', jsonb_build_object('quantity', 2)
            )
          ))
        ),
        NULL
      );
    END;
    $do$;
  $q$,
  'authenticated owner may patch via patch_character_relational'
);

SELECT throws_ok(
  $q$
    DO $do$
    BEGIN
      SET LOCAL ROLE authenticated;
      PERFORM set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-0000000000aa', true);
      PERFORM public.apply_character_inventory_patch(
        'pgtap-role-char', '10000000-0000-4000-8000-0000000000aa',
        jsonb_build_object('ops', '[]'::jsonb)
      );
    END;
    $do$;
  $q$,
  '42501', NULL, 'authenticated cannot EXECUTE apply_character_inventory_patch directly'
);

SELECT * FROM finish();
ROLLBACK;