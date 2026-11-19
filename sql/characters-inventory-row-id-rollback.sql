-- Rollback for characters-inventory-row-id.sql (apply only after explicit OK and backup).
BEGIN;

DROP INDEX IF EXISTS public.character_inventory_inventory_row_id_key;

ALTER TABLE public.character_inventory
  DROP COLUMN IF EXISTS inventory_row_id;

COMMIT;