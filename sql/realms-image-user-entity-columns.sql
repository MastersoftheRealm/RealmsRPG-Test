-- User-library image_id FK columns — user_* art consumers (TASK-497 / ADR-0003)
-- Status: APPLIED 2026-07-17 via Supabase MCP apply_migration (`realms_image_user_entity_columns`).
--
-- Adds nullable image_id → realms_images.id on art-capable user library tables.
-- Keeps denormalized image_url as read cache (synced on bank replace via /api/images/[id]/replace).
-- Same semantics as official/codex columns from sql/realms-image-entity-columns.sql (TASK-494).
-- Does NOT add art columns to feats, skills, archetypes, parts, properties, creature feats, traits.
-- No separate user_equipment table — armament art lives on user_items.
--
-- Prerequisite: sql/realms-image-library.sql (realms_images catalog) — applied.

-- ---------------------------------------------------------------------------
-- Helper: add image_id + optional image_url cache on a consumer table
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._add_entity_image_columns(p_table regclass, p_add_image_url boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  t_name text := p_table::text;
BEGIN
  EXECUTE format(
    'ALTER TABLE %s ADD COLUMN IF NOT EXISTS image_id UUID REFERENCES public.realms_images(id) ON DELETE SET NULL',
    p_table
  );

  IF p_add_image_url THEN
    EXECUTE format(
      'ALTER TABLE %s ADD COLUMN IF NOT EXISTS image_url TEXT',
      p_table
    );
  END IF;

  EXECUTE format(
    'COMMENT ON COLUMN %s.image_id IS %L',
    p_table,
    'FK → realms_images.id (ADR-0003). Source of truth for card art; image_url is optional denormalized cache.'
  );

  IF p_add_image_url THEN
    EXECUTE format(
      'COMMENT ON COLUMN %s.image_url IS %L',
      p_table,
      'Denormalized public URL cache synced when the bank master is replaced.'
    );
  END IF;

  EXECUTE format(
    'CREATE INDEX IF NOT EXISTS %I ON %s (image_id) WHERE image_id IS NOT NULL',
    'idx_' || replace(t_name, 'public.', '') || '_image_id',
    p_table
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- User library
-- ---------------------------------------------------------------------------
SELECT public._add_entity_image_columns('public.user_species'::regclass, true);
SELECT public._add_entity_image_columns('public.user_creatures'::regclass, true);
SELECT public._add_entity_image_columns('public.user_items'::regclass, true);
SELECT public._add_entity_image_columns('public.user_powers'::regclass, true);
SELECT public._add_entity_image_columns('public.user_techniques'::regclass, true);
SELECT public._add_entity_image_columns('public.user_empowered_techniques'::regclass, true);

DROP FUNCTION public._add_entity_image_columns(regclass, boolean);
