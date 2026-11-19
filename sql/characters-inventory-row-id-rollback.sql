-- Step 3 of full rollback — see `sql/characters-inventory-full-rollback-86e3juw0a.sql`.
-- Apply only **after** CAS rollback + master `characters-relational-{expand,read-rpc,write-rpc}.sql`.
BEGIN;

DROP INDEX IF EXISTS public.character_inventory_inventory_row_id_key;

ALTER TABLE public.character_inventory
  DROP COLUMN IF EXISTS inventory_row_id;

COMMIT;