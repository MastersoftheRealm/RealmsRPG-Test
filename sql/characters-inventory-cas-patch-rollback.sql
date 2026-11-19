-- Rollback CAS helpers from characters-inventory-cas-patch SQL in this repo.
-- Re-apply characters-relational-read-rpc.sql + characters-relational-write-rpc.sql
-- from the previous commit after rollback. Not for agent apply without owner OK + backup.
BEGIN;

DROP FUNCTION IF EXISTS public.apply_character_inventory_patch(text, text, jsonb);
DROP FUNCTION IF EXISTS public.inventory_patch_field_clear(jsonb, text);
DROP FUNCTION IF EXISTS public.inventory_item_from_patch(jsonb);
DROP FUNCTION IF EXISTS public.inventory_row_cas_snapshot(public.character_inventory);
DROP FUNCTION IF EXISTS public.inventory_patch_bucket_category(text);

COMMIT;