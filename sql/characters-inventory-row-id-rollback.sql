-- Step 3 of full rollback — see `sql/characters-inventory-full-rollback.sql`.
-- Apply only **after** CAS rollback + master `characters-relational-{expand,read-rpc,write-rpc}.sql`.
BEGIN;

ALTER TABLE public.character_inventory
  DROP CONSTRAINT IF EXISTS character_inventory_inventory_row_id_key;

DROP INDEX IF EXISTS public.character_inventory_inventory_row_id_key;

ALTER TABLE public.character_inventory
  DROP COLUMN IF EXISTS inventory_row_id;

COMMIT;