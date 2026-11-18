-- RPC coverage for 86e3juw0a inventory CAS (run after characters-inventory-cas-patch-86e3juw0a.sql).
BEGIN;

DO $tests$
DECLARE
  v_owner_id text;
  v_id text := 'inventory-cas-test-character';
  v_document jsonb;
  v_result jsonb;
  v_token text;
BEGIN
  SELECT user_id INTO v_owner_id FROM public.characters ORDER BY id LIMIT 1;
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Inventory CAS test requires an existing character owner';
  END IF;

  v_document := jsonb_build_object(
    'name','Inventory CAS Test',
    'level',1,
    'visibility','private',
    'equipment', jsonb_build_object(
      'items', jsonb_build_array(
        jsonb_build_object('id','health-potion','name','Health Potion','quantity',1),
        jsonb_build_object('id','energy-potion','name','Energy Potion','quantity',1)
      )
    )
  );

  PERFORM public.provision_character_relational(v_id, v_owner_id, v_document);

  PERFORM set_config(
    'request.jwt.claims',
    jsonb_build_object('sub',v_owner_id,'role','authenticated')::text,
    true
  );

  v_token := public.get_character_relational_document(v_id)->>'updatedAt';

  v_result := public.patch_character_relational(
    v_id,
    jsonb_build_object(
      'inventoryPatch', jsonb_build_object(
        'ops', jsonb_build_array(
          jsonb_build_object(
            'op','update','bucket','items','id','health-potion',
            'expectedQuantity',1,
            'item', jsonb_build_object('id','health-potion','name','Health Potion','quantity',3)
          )
        )
      )
    ),
    v_token
  );
  IF v_result->>'status' <> 'updated' THEN
    RAISE EXCEPTION 'Update op failed: %', v_result;
  END IF;

  v_token := v_result->>'updatedAt';

  v_result := public.patch_character_relational(
    v_id,
    jsonb_build_object(
      'inventoryPatch', jsonb_build_object(
        'ops', jsonb_build_array(
          jsonb_build_object(
            'op','update','bucket','items','id','energy-potion',
            'expectedQuantity',1,
            'item', jsonb_build_object('id','energy-potion','name','Energy Potion','quantity',2)
          )
        )
      )
    ),
    v_token
  );
  IF v_result->>'status' <> 'updated' THEN
    RAISE EXCEPTION 'Second tab update failed: %', v_result;
  END IF;

  v_document := public.get_character_relational_document(v_id);
  IF v_document#>>'{equipment,items,0,quantity}' <> '3'
     AND v_document#>>'{equipment,items,1,quantity}' <> '2' THEN
    IF NOT (
      v_document @? '$.equipment.items[*] ? (@.id == "health-potion" && @.quantity == 3)'
      AND v_document @? '$.equipment.items[*] ? (@.id == "energy-potion" && @.quantity == 2)'
    ) THEN
      RAISE EXCEPTION 'Both quantities were not preserved: %', v_document->'equipment';
    END IF;
  END IF;

  v_token := v_document->>'updatedAt';
  v_result := public.patch_character_relational(
    v_id,
    jsonb_build_object(
      'inventoryPatch', jsonb_build_object(
        'ops', jsonb_build_array(
          jsonb_build_object(
            'op','update','bucket','items','id','health-potion',
            'expectedQuantity',99,
            'item', jsonb_build_object('id','health-potion','quantity',50)
          )
        )
      )
    ),
    v_token
  );
  IF v_result->>'status' <> 'conflict' THEN
    RAISE EXCEPTION 'Expected quantity mismatch conflict, got %', v_result;
  END IF;

  DELETE FROM public.characters WHERE id = v_id;
END;
$tests$;

ROLLBACK;