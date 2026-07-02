-- Security hardening: drop legacy table, fix function search_path, RLS gaps, revoke rls_auto_enable RPC
-- Run in Supabase Dashboard → SQL Editor (or via Supabase MCP apply_migration).

-- -----------------------------------------------------------------------------
-- 1) Drop unused Prisma legacy table (RLS enabled, no policies)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public._prisma_migrations;

-- -----------------------------------------------------------------------------
-- 2) Pin search_path on trigger functions (Supabase linter 0011)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_ui_tooltips_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prune_codex_change_logs_to_latest_ten()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.codex_change_logs c
  WHERE c.entity_type = NEW.entity_type
    AND c.entity_id = NEW.entity_id
    AND c.id NOT IN (
      SELECT id
      FROM public.codex_change_logs
      WHERE entity_type = NEW.entity_type
        AND entity_id = NEW.entity_id
      ORDER BY changed_at DESC, id DESC
      LIMIT 10
    );

  RETURN NEW;
END;
$$;

-- Body matches sql/supabase-library-columnar-parity-expansion.sql; search_path added.
CREATE OR REPLACE FUNCTION public.sync_library_promoted_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  payload_doc JSONB := COALESCE(NEW.payload, '{}'::jsonb);
BEGIN
  NEW.payload := payload_doc;

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

-- -----------------------------------------------------------------------------
-- 3) RLS: codex_archetype_levels (public read; service_role writes via admin actions)
-- -----------------------------------------------------------------------------
GRANT SELECT ON public.codex_archetype_levels TO anon, authenticated;

ALTER TABLE public.codex_archetype_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex archetype levels" ON public.codex_archetype_levels;
CREATE POLICY "Anyone can read codex archetype levels"
  ON public.codex_archetype_levels FOR SELECT TO public USING (true);

-- -----------------------------------------------------------------------------
-- 4) RLS: official_enhanced_items (public read; admin write via authenticated session)
-- -----------------------------------------------------------------------------
GRANT SELECT ON public.official_enhanced_items TO anon, authenticated;
GRANT ALL ON public.official_enhanced_items TO service_role;

ALTER TABLE public.official_enhanced_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read official enhanced items" ON public.official_enhanced_items;
CREATE POLICY "Anyone can read official enhanced items"
  ON public.official_enhanced_items FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admin can insert official enhanced items" ON public.official_enhanced_items;
CREATE POLICY "Admin can insert official enhanced items"
  ON public.official_enhanced_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid()::text AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can update official enhanced items" ON public.official_enhanced_items;
CREATE POLICY "Admin can update official enhanced items"
  ON public.official_enhanced_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid()::text AND role = 'admin'));

DROP POLICY IF EXISTS "Admin can delete official enhanced items" ON public.official_enhanced_items;
CREATE POLICY "Admin can delete official enhanced items"
  ON public.official_enhanced_items FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid()::text AND role = 'admin'));

-- -----------------------------------------------------------------------------
-- 5) Revoke REST RPC access to rls_auto_enable (event trigger only; SECURITY DEFINER)
-- -----------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
