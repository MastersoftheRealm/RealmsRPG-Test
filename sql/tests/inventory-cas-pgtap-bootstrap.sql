-- Minimal schema for inventory CAS pgTAP (local Supabase only; not production).
CREATE EXTENSION IF NOT EXISTS pgtap;

CREATE TABLE IF NOT EXISTS public.characters (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  updated_at timestamp without time zone NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
);

CREATE TABLE IF NOT EXISTS public.character_inventory (
  character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  inventory_row_id uuid NOT NULL DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('weapon','shield','armor','equipment','accessory')),
  position integer NOT NULL CHECK (position > 0),
  source_kind text NOT NULL DEFAULT 'custom',
  source_id text,
  name_snapshot text,
  slot text,
  official_item_id text,
  user_item_id text,
  codex_equipment_id text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  equipped boolean NOT NULL DEFAULT false,
  custom_type text,
  custom_description text,
  cost_snapshot numeric,
  PRIMARY KEY (character_id, category, position),
  CONSTRAINT character_inventory_inventory_row_id_key UNIQUE (inventory_row_id)
);

CREATE OR REPLACE FUNCTION public.insert_character_inventory_item(
  p_character_id text, p_owner_id text, p_category text,
  p_position integer, p_item jsonb, p_slot text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql AS $fn$
BEGIN
  INSERT INTO public.character_inventory (
    character_id, inventory_row_id, category, position, source_kind, source_id, name_snapshot,
    slot, quantity, equipped, custom_type, custom_description, cost_snapshot
  ) VALUES (
    p_character_id,
    coalesce(nullif(p_item->>'inventoryRowId','')::uuid, gen_random_uuid()),
    p_category, p_position, 'custom', nullif(p_item->>'id',''), nullif(p_item->>'name',''),
    p_slot,
    coalesce(nullif(p_item->>'quantity','')::integer, 1),
    coalesce(nullif(p_item->>'equipped','')::boolean, false),
    p_item->>'type', p_item->>'description',
    nullif(p_item->>'cost','')::numeric
  );
END;
$fn$;