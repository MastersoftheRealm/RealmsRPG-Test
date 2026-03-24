-- =============================================================================
-- Separate Empowered Technique tables (user + official)
-- =============================================================================
-- Creates:
--   - public.user_empowered_techniques
--   - public.official_empowered_techniques
-- Backfills empowered rows from existing *_techniques tables.
--
-- Run in Supabase SQL editor.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- User library: dedicated empowered techniques table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_empowered_techniques (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name        TEXT,
  description TEXT,
  action_type TEXT,
  weapon_name TEXT,
  created_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS user_empowered_techniques_user_id_idx
  ON public.user_empowered_techniques(user_id);

ALTER TABLE public.user_empowered_techniques ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own empowered techniques" ON public.user_empowered_techniques;
CREATE POLICY "Users can read own empowered techniques"
  ON public.user_empowered_techniques FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can insert own empowered techniques" ON public.user_empowered_techniques;
CREATE POLICY "Users can insert own empowered techniques"
  ON public.user_empowered_techniques FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can update own empowered techniques" ON public.user_empowered_techniques;
CREATE POLICY "Users can update own empowered techniques"
  ON public.user_empowered_techniques FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())::text)
  WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can delete own empowered techniques" ON public.user_empowered_techniques;
CREATE POLICY "Users can delete own empowered techniques"
  ON public.user_empowered_techniques FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid())::text);

-- -----------------------------------------------------------------------------
-- Official library: dedicated empowered techniques table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.official_empowered_techniques (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  description TEXT,
  action_type TEXT,
  weapon_name TEXT,
  created_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.official_empowered_techniques ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read official empowered techniques" ON public.official_empowered_techniques;
CREATE POLICY "Anyone can read official empowered techniques"
  ON public.official_empowered_techniques FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Admin can insert official empowered techniques" ON public.official_empowered_techniques;
CREATE POLICY "Admin can insert official empowered techniques"
  ON public.official_empowered_techniques FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()::text
      AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admin can update official empowered techniques" ON public.official_empowered_techniques;
CREATE POLICY "Admin can update official empowered techniques"
  ON public.official_empowered_techniques FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()::text
      AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Admin can delete official empowered techniques" ON public.official_empowered_techniques;
CREATE POLICY "Admin can delete official empowered techniques"
  ON public.official_empowered_techniques FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()::text
      AND role = 'admin'
  ));

-- -----------------------------------------------------------------------------
-- Backfill/move data from mixed techniques tables into dedicated empowered tables
-- -----------------------------------------------------------------------------
INSERT INTO public.user_empowered_techniques (
  id, user_id, name, description, action_type, weapon_name, created_at, updated_at, payload
)
SELECT
  t.id,
  t.user_id,
  t.name,
  t.description,
  t.action_type,
  t.weapon_name,
  t.created_at,
  t.updated_at,
  t.payload
FROM public.user_techniques t
WHERE
  COALESCE((t.payload->>'empoweredTechnique')::boolean, (t.payload->>'empowered_technique')::boolean, false)
  OR (t.payload ? 'power' AND t.payload ? 'technique')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  action_type = EXCLUDED.action_type,
  weapon_name = EXCLUDED.weapon_name,
  updated_at = EXCLUDED.updated_at,
  payload = EXCLUDED.payload;

DELETE FROM public.user_techniques t
WHERE EXISTS (
  SELECT 1
  FROM public.user_empowered_techniques et
  WHERE et.id = t.id
);

INSERT INTO public.official_empowered_techniques (
  id, name, description, action_type, weapon_name, created_at, updated_at, payload
)
SELECT
  t.id,
  t.name,
  t.description,
  t.action_type,
  t.weapon_name,
  t.created_at,
  t.updated_at,
  t.payload
FROM public.official_techniques t
WHERE
  COALESCE((t.payload->>'empoweredTechnique')::boolean, (t.payload->>'empowered_technique')::boolean, false)
  OR (t.payload ? 'power' AND t.payload ? 'technique')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  action_type = EXCLUDED.action_type,
  weapon_name = EXCLUDED.weapon_name,
  updated_at = EXCLUDED.updated_at,
  payload = EXCLUDED.payload;

DELETE FROM public.official_techniques t
WHERE EXISTS (
  SELECT 1
  FROM public.official_empowered_techniques et
  WHERE et.id = t.id
);

COMMIT;
