-- Stable per-row id for character_inventory (apply after named backup; agents do not run).
-- Then apply helpers + re-apply expand, read-rpc, write-rpc from the same git commit.
BEGIN;

ALTER TABLE public.character_inventory
  ADD COLUMN IF NOT EXISTS inventory_row_id uuid;

UPDATE public.character_inventory
SET inventory_row_id = gen_random_uuid()
WHERE inventory_row_id IS NULL;

ALTER TABLE public.character_inventory
  ALTER COLUMN inventory_row_id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN inventory_row_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS character_inventory_inventory_row_id_key
  ON public.character_inventory (inventory_row_id);

COMMIT;