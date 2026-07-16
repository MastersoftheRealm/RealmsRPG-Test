-- Entity image_id FK columns — official/codex art consumers (TASK-494 / ADR-0003)
-- Status: APPLIED 2026-07-16 via Supabase MCP apply_migration (`realms_image_entity_columns`), owner-approved.
--
-- Adds nullable image_id → realms_images.id on art-capable official/codex tables.
-- Keeps denormalized image_url as read cache (synced on bank replace via /api/images/[id]/replace).
-- User-library parity (user_*) is TASK-497 — not included here.
-- Does NOT add art columns to feats, skills, archetypes, parts, properties, creature feats, traits.
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
      'Denormalized public URL cache synced when the bank master is replaced. Fallback until TASK-498 backfill.'
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
-- Codex
-- ---------------------------------------------------------------------------
SELECT public._add_entity_image_columns('public.codex_species'::regclass, true);
SELECT public._add_entity_image_columns('public.codex_equipment'::regclass, true);

-- ---------------------------------------------------------------------------
-- Official library
-- ---------------------------------------------------------------------------
SELECT public._add_entity_image_columns('public.official_creatures'::regclass, true);
SELECT public._add_entity_image_columns('public.official_powers'::regclass, true);
SELECT public._add_entity_image_columns('public.official_techniques'::regclass, true);
SELECT public._add_entity_image_columns('public.official_empowered_techniques'::regclass, true);
SELECT public._add_entity_image_columns('public.official_items'::regclass, true);

-- official_items.image_url may already exist from official-items-image-url.sql — idempotent above.

DROP FUNCTION public._add_entity_image_columns(regclass, boolean);
