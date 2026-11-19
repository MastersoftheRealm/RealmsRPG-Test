-- Step 1 of full rollback — see `sql/characters-inventory-full-rollback-86e3juw0a.sql`.
-- Do **not** drop `inventory_row_id` until master expand/read/write are re-applied (ref 8ae31ecd).
BEGIN;

DROP FUNCTION IF EXISTS public.apply_character_inventory_patch(text, text, jsonb);
DROP FUNCTION IF EXISTS public.inventory_patch_field_clear(jsonb, text);
DROP FUNCTION IF EXISTS public.inventory_item_from_patch(jsonb);
DROP FUNCTION IF EXISTS public.inventory_row_cas_snapshot(public.character_inventory);
DROP FUNCTION IF EXISTS public.inventory_patch_bucket_category(text);

COMMIT;