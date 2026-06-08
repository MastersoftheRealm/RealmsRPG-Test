-- =============================================================================
-- Library columnar parity expansion (official + user)
-- =============================================================================
-- Goal:
--   - Keep official_* and user_* table shapes aligned.
--   - Promote high-value payload fields into typed columns.
--   - Preserve backward compatibility by syncing from payload in DB triggers.
--
-- Run in Supabase SQL editor after:
--   - sql/supabase-official-library-public-schema.sql
--   - existing user_* columnar migrations
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Powers: promoted columns (official + user)
-- -----------------------------------------------------------------------------
ALTER TABLE public.official_powers
  ADD COLUMN IF NOT EXISTS range_steps INTEGER,
  ADD COLUMN IF NOT EXISTS duration_type TEXT,
  ADD COLUMN IF NOT EXISTS duration_value INTEGER,
  ADD COLUMN IF NOT EXISTS area_type TEXT,
  ADD COLUMN IF NOT EXISTS area_level INTEGER,
  ADD COLUMN IF NOT EXISTS damage JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.user_powers
  ADD COLUMN IF NOT EXISTS range_steps INTEGER,
  ADD COLUMN IF NOT EXISTS duration_type TEXT,
  ADD COLUMN IF NOT EXISTS duration_value INTEGER,
  ADD COLUMN IF NOT EXISTS area_type TEXT,
  ADD COLUMN IF NOT EXISTS area_level INTEGER,
  ADD COLUMN IF NOT EXISTS damage JSONB NOT NULL DEFAULT '[]'::jsonb;

-- -----------------------------------------------------------------------------
-- Techniques / empowered techniques: promoted columns (official + user)
-- -----------------------------------------------------------------------------
ALTER TABLE public.official_techniques
  ADD COLUMN IF NOT EXISTS range_steps INTEGER,
  ADD COLUMN IF NOT EXISTS duration_type TEXT,
  ADD COLUMN IF NOT EXISTS duration_value INTEGER,
  ADD COLUMN IF NOT EXISTS damage JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.user_techniques
  ADD COLUMN IF NOT EXISTS range_steps INTEGER,
  ADD COLUMN IF NOT EXISTS duration_type TEXT,
  ADD COLUMN IF NOT EXISTS duration_value INTEGER,
  ADD COLUMN IF NOT EXISTS damage JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.official_empowered_techniques
  ADD COLUMN IF NOT EXISTS range_steps INTEGER,
  ADD COLUMN IF NOT EXISTS duration_type TEXT,
  ADD COLUMN IF NOT EXISTS duration_value INTEGER,
  ADD COLUMN IF NOT EXISTS damage JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.user_empowered_techniques
  ADD COLUMN IF NOT EXISTS range_steps INTEGER,
  ADD COLUMN IF NOT EXISTS duration_type TEXT,
  ADD COLUMN IF NOT EXISTS duration_value INTEGER,
  ADD COLUMN IF NOT EXISTS damage JSONB NOT NULL DEFAULT '[]'::jsonb;

-- -----------------------------------------------------------------------------
-- Items: promoted columns (official + user)
-- -----------------------------------------------------------------------------
ALTER TABLE public.official_items
  ADD COLUMN IF NOT EXISTS range_steps INTEGER,
  ADD COLUMN IF NOT EXISTS is_two_handed BOOLEAN,
  ADD COLUMN IF NOT EXISTS ability_requirement JSONB,
  ADD COLUMN IF NOT EXISTS costs JSONB,
  ADD COLUMN IF NOT EXISTS damage JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS properties JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS agility_reduction INTEGER,
  ADD COLUMN IF NOT EXISTS critical_range_increase INTEGER,
  ADD COLUMN IF NOT EXISTS shield_dr JSONB,
  ADD COLUMN IF NOT EXISTS shield_damage JSONB;

ALTER TABLE public.user_items
  ADD COLUMN IF NOT EXISTS range_steps INTEGER,
  ADD COLUMN IF NOT EXISTS is_two_handed BOOLEAN,
  ADD COLUMN IF NOT EXISTS ability_requirement JSONB,
  ADD COLUMN IF NOT EXISTS costs JSONB,
  ADD COLUMN IF NOT EXISTS damage JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS properties JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS agility_reduction INTEGER,
  ADD COLUMN IF NOT EXISTS critical_range_increase INTEGER,
  ADD COLUMN IF NOT EXISTS shield_dr JSONB,
  ADD COLUMN IF NOT EXISTS shield_damage JSONB;

-- -----------------------------------------------------------------------------
-- Trigger function: keep promoted columns in sync from payload (transitional)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_library_promoted_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  payload_doc JSONB := COALESCE(NEW.payload, '{}'::jsonb);
BEGIN
  NEW.payload := payload_doc;

  -- Powers
  IF TG_TABLE_NAME IN ('official_powers', 'user_powers') THEN
    NEW.range_steps := COALESCE(
      NEW.range_steps,
      CASE
        WHEN (payload_doc->'range'->>'steps') ~ '^-?[0-9]+$' THEN (payload_doc->'range'->>'steps')::INTEGER
        ELSE NULL
      END
    );
    NEW.duration_type := COALESCE(NEW.duration_type, payload_doc->'duration'->>'type');
    NEW.duration_value := COALESCE(
      NEW.duration_value,
      CASE
        WHEN (payload_doc->'duration'->>'value') ~ '^-?[0-9]+$' THEN (payload_doc->'duration'->>'value')::INTEGER
        ELSE NULL
      END
    );
    NEW.area_type := COALESCE(NEW.area_type, payload_doc->'area'->>'type');
    NEW.area_level := COALESCE(
      NEW.area_level,
      CASE
        WHEN (payload_doc->'area'->>'level') ~ '^-?[0-9]+$' THEN (payload_doc->'area'->>'level')::INTEGER
        ELSE NULL
      END
    );
    NEW.damage := COALESCE(
      NEW.damage,
      CASE WHEN jsonb_typeof(payload_doc->'damage') = 'array' THEN payload_doc->'damage' ELSE NULL END,
      '[]'::jsonb
    );
    RETURN NEW;
  END IF;

  -- Techniques + empowered techniques
  IF TG_TABLE_NAME IN (
    'official_techniques',
    'user_techniques',
    'official_empowered_techniques',
    'user_empowered_techniques'
  ) THEN
    NEW.range_steps := COALESCE(
      NEW.range_steps,
      CASE
        WHEN (payload_doc->'range'->>'steps') ~ '^-?[0-9]+$' THEN (payload_doc->'range'->>'steps')::INTEGER
        WHEN (payload_doc->'power'->'range'->>'steps') ~ '^-?[0-9]+$' THEN (payload_doc->'power'->'range'->>'steps')::INTEGER
        ELSE NULL
      END
    );
    NEW.duration_type := COALESCE(
      NEW.duration_type,
      payload_doc->'duration'->>'type',
      payload_doc->'power'->'duration'->>'type'
    );
    NEW.duration_value := COALESCE(
      NEW.duration_value,
      CASE
        WHEN (payload_doc->'duration'->>'value') ~ '^-?[0-9]+$' THEN (payload_doc->'duration'->>'value')::INTEGER
        WHEN (payload_doc->'power'->'duration'->>'value') ~ '^-?[0-9]+$' THEN (payload_doc->'power'->'duration'->>'value')::INTEGER
        ELSE NULL
      END
    );
    NEW.damage := COALESCE(
      NEW.damage,
      CASE
        WHEN jsonb_typeof(payload_doc->'damage') = 'array' THEN payload_doc->'damage'
        WHEN jsonb_typeof(payload_doc->'power'->'damage') = 'array' THEN payload_doc->'power'->'damage'
        ELSE NULL
      END,
      '[]'::jsonb
    );
    RETURN NEW;
  END IF;

  -- Items
  IF TG_TABLE_NAME IN ('official_items', 'user_items') THEN
    NEW.range_steps := COALESCE(
      NEW.range_steps,
      CASE
        WHEN (payload_doc->>'rangeLevel') ~ '^-?[0-9]+$' THEN (payload_doc->>'rangeLevel')::INTEGER
        WHEN (payload_doc->'range'->>'steps') ~ '^-?[0-9]+$' THEN (payload_doc->'range'->>'steps')::INTEGER
        ELSE NULL
      END
    );
    NEW.is_two_handed := COALESCE(
      NEW.is_two_handed,
      CASE
        WHEN payload_doc ? 'isTwoHanded' THEN (payload_doc->>'isTwoHanded')::BOOLEAN
        ELSE NULL
      END
    );
    NEW.ability_requirement := COALESCE(
      NEW.ability_requirement,
      CASE WHEN jsonb_typeof(payload_doc->'abilityRequirement') = 'object' THEN payload_doc->'abilityRequirement' ELSE NULL END
    );
    NEW.costs := COALESCE(
      NEW.costs,
      CASE WHEN jsonb_typeof(payload_doc->'costs') = 'object' THEN payload_doc->'costs' ELSE NULL END
    );
    NEW.damage := COALESCE(
      NEW.damage,
      CASE WHEN jsonb_typeof(payload_doc->'damage') = 'array' THEN payload_doc->'damage' ELSE NULL END,
      '[]'::jsonb
    );
    NEW.properties := COALESCE(
      NEW.properties,
      CASE WHEN jsonb_typeof(payload_doc->'properties') = 'array' THEN payload_doc->'properties' ELSE NULL END,
      '[]'::jsonb
    );
    NEW.agility_reduction := COALESCE(
      NEW.agility_reduction,
      CASE
        WHEN (payload_doc->>'agilityReduction') ~ '^-?[0-9]+$' THEN (payload_doc->>'agilityReduction')::INTEGER
        ELSE NULL
      END
    );
    NEW.critical_range_increase := COALESCE(
      NEW.critical_range_increase,
      CASE
        WHEN (payload_doc->>'criticalRangeIncrease') ~ '^-?[0-9]+$' THEN (payload_doc->>'criticalRangeIncrease')::INTEGER
        ELSE NULL
      END
    );
    NEW.shield_dr := COALESCE(
      NEW.shield_dr,
      CASE WHEN jsonb_typeof(payload_doc->'shieldDR') = 'object' THEN payload_doc->'shieldDR' ELSE NULL END
    );
    NEW.shield_damage := COALESCE(
      NEW.shield_damage,
      CASE WHEN jsonb_typeof(payload_doc->'shieldDamage') = 'object' THEN payload_doc->'shieldDamage' ELSE NULL END
    );
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_library_promoted_columns_official_powers ON public.official_powers;
CREATE TRIGGER trg_sync_library_promoted_columns_official_powers
BEFORE INSERT OR UPDATE ON public.official_powers
FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();

DROP TRIGGER IF EXISTS trg_sync_library_promoted_columns_user_powers ON public.user_powers;
CREATE TRIGGER trg_sync_library_promoted_columns_user_powers
BEFORE INSERT OR UPDATE ON public.user_powers
FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();

DROP TRIGGER IF EXISTS trg_sync_library_promoted_columns_official_techniques ON public.official_techniques;
CREATE TRIGGER trg_sync_library_promoted_columns_official_techniques
BEFORE INSERT OR UPDATE ON public.official_techniques
FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();

DROP TRIGGER IF EXISTS trg_sync_library_promoted_columns_user_techniques ON public.user_techniques;
CREATE TRIGGER trg_sync_library_promoted_columns_user_techniques
BEFORE INSERT OR UPDATE ON public.user_techniques
FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();

DROP TRIGGER IF EXISTS trg_sync_library_promoted_columns_official_empowered_techniques ON public.official_empowered_techniques;
CREATE TRIGGER trg_sync_library_promoted_columns_official_empowered_techniques
BEFORE INSERT OR UPDATE ON public.official_empowered_techniques
FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();

DROP TRIGGER IF EXISTS trg_sync_library_promoted_columns_user_empowered_techniques ON public.user_empowered_techniques;
CREATE TRIGGER trg_sync_library_promoted_columns_user_empowered_techniques
BEFORE INSERT OR UPDATE ON public.user_empowered_techniques
FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();

DROP TRIGGER IF EXISTS trg_sync_library_promoted_columns_official_items ON public.official_items;
CREATE TRIGGER trg_sync_library_promoted_columns_official_items
BEFORE INSERT OR UPDATE ON public.official_items
FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();

DROP TRIGGER IF EXISTS trg_sync_library_promoted_columns_user_items ON public.user_items;
CREATE TRIGGER trg_sync_library_promoted_columns_user_items
BEFORE INSERT OR UPDATE ON public.user_items
FOR EACH ROW EXECUTE FUNCTION public.sync_library_promoted_columns();

-- -----------------------------------------------------------------------------
-- Backfill existing rows via trigger execution
-- -----------------------------------------------------------------------------
UPDATE public.official_powers SET payload = COALESCE(payload, '{}'::jsonb);
UPDATE public.user_powers SET payload = COALESCE(payload, '{}'::jsonb);
UPDATE public.official_techniques SET payload = COALESCE(payload, '{}'::jsonb);
UPDATE public.user_techniques SET payload = COALESCE(payload, '{}'::jsonb);
UPDATE public.official_empowered_techniques SET payload = COALESCE(payload, '{}'::jsonb);
UPDATE public.user_empowered_techniques SET payload = COALESCE(payload, '{}'::jsonb);
UPDATE public.official_items SET payload = COALESCE(payload, '{}'::jsonb);
UPDATE public.user_items SET payload = COALESCE(payload, '{}'::jsonb);

-- Optional supporting indexes for common filtering/sorting
CREATE INDEX IF NOT EXISTS official_items_type_rarity_idx ON public.official_items (type, rarity);
CREATE INDEX IF NOT EXISTS user_items_user_id_type_rarity_idx ON public.user_items (user_id, type, rarity);
CREATE INDEX IF NOT EXISTS official_powers_action_type_idx ON public.official_powers (action_type);
CREATE INDEX IF NOT EXISTS user_powers_user_id_action_type_idx ON public.user_powers (user_id, action_type);
CREATE INDEX IF NOT EXISTS official_techniques_action_type_idx ON public.official_techniques (action_type);
CREATE INDEX IF NOT EXISTS user_techniques_user_id_action_type_idx ON public.user_techniques (user_id, action_type);

COMMIT;
