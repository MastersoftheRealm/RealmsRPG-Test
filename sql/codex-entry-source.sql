-- TASK-928: rules source on every columnar codex entry.
-- Examples: 'Core Rules', 'Crafting Expansion'. Null until an admin sets it.
-- Not an access-control gate. Species is_starter is unchanged (guided starter flag).
-- Idempotent. No backfill.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'codex_feats',
    'codex_skills',
    'codex_species',
    'codex_traits',
    'codex_parts',
    'codex_properties',
    'codex_equipment',
    'codex_archetypes',
    'codex_creature_feats'
  ]
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS source text',
      t
    );
    EXECUTE format(
      'COMMENT ON COLUMN public.%I.source IS %L',
      t,
      'Rules product this entry belongs to (for example Core Rules or an expansion). Null until an admin sets it.'
    );
  END LOOP;
END $$;
