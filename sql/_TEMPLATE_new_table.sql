-- =============================================================================
-- Template: new table in public (copy → rename → fill policies)
-- =============================================================================
-- Supabase stops auto-granting Data API access on new public tables (Oct 2026).
-- Every CREATE TABLE in public must, in the same file:
--   1. ENABLE ROW LEVEL SECURITY
--   2. CREATE POLICY … (least privilege)
--   3. GRANT explicitly (authenticated + service_role; anon SELECT only if public-read)
-- See sql/README.md and AGENTS.md.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.example_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.example_items IS 'Replace with real table comment.';

-- ---------------------------------------------------------------------------
-- RLS + policies (replace USING / WITH CHECK for your auth model)
-- ---------------------------------------------------------------------------
ALTER TABLE public.example_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own example items" ON public.example_items;
CREATE POLICY "Users can read own example items"
  ON public.example_items FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own example items" ON public.example_items;
CREATE POLICY "Users can insert own example items"
  ON public.example_items FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own example items" ON public.example_items;
CREATE POLICY "Users can update own example items"
  ON public.example_items FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own example items" ON public.example_items;
CREATE POLICY "Users can delete own example items"
  ON public.example_items FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- Grants (required for PostgREST / Data API)
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.example_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.example_items TO service_role;

-- Public-read tables only (codex-style guest SELECT): uncomment and document why.
-- GRANT SELECT ON public.example_items TO anon;
