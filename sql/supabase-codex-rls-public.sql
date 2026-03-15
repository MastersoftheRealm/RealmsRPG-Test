-- =============================================================================
-- RLS for codex and core_rules in PUBLIC schema
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor if GET /api/codex returns 500
-- (permission denied). Grants table-level SELECT to anon/authenticated, enables
-- RLS, and adds "Anyone can read" policies so the Data API and anon key can read.
--
-- Admin codex writes: server actions use service_role (bypasses RLS). Ensure
-- service_role can write: grant INSERT/UPDATE/DELETE on codex_archetypes and
-- codex_archetype_levels to service_role. Optionally, grant to authenticated
-- and add admin-only RLS policies so session-based admin writes work too.
--
-- Best practice (Supabase): Table access needs BOTH (1) GRANT and (2) RLS policy.
-- =============================================================================

-- Table-level grants (read for anon/authenticated)
GRANT SELECT ON public.codex_feats TO anon, authenticated;
GRANT SELECT ON public.codex_skills TO anon, authenticated;
GRANT SELECT ON public.codex_species TO anon, authenticated;
GRANT SELECT ON public.codex_traits TO anon, authenticated;
GRANT SELECT ON public.codex_parts TO anon, authenticated;
GRANT SELECT ON public.codex_properties TO anon, authenticated;
GRANT SELECT ON public.codex_equipment TO anon, authenticated;
GRANT SELECT ON public.codex_archetypes TO anon, authenticated;
GRANT SELECT ON public.codex_creature_feats TO anon, authenticated;
GRANT SELECT ON public.core_rules TO anon, authenticated;

-- Admin writes: server actions use SUPABASE_SERVICE_ROLE_KEY (role: service_role).
-- If admin save returns "permission denied for table codex_archetypes", run the
-- GRANT ALL block below. (If your project uses a different role for the service key,
-- replace service_role in the grants.)
GRANT ALL ON public.codex_archetypes TO service_role;
GRANT ALL ON public.codex_archetype_levels TO service_role;
GRANT ALL ON public.codex_feats TO service_role;
GRANT ALL ON public.codex_skills TO service_role;
GRANT ALL ON public.codex_species TO service_role;
GRANT ALL ON public.codex_traits TO service_role;
GRANT ALL ON public.codex_parts TO service_role;
GRANT ALL ON public.codex_properties TO service_role;
GRANT ALL ON public.codex_equipment TO service_role;
GRANT ALL ON public.codex_creature_feats TO service_role;
GRANT ALL ON public.core_rules TO service_role;

-- codex_feats
ALTER TABLE public.codex_feats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex feats" ON public.codex_feats;
CREATE POLICY "Anyone can read codex feats" ON public.codex_feats FOR SELECT TO public USING (true);

-- codex_skills
ALTER TABLE public.codex_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex skills" ON public.codex_skills;
CREATE POLICY "Anyone can read codex skills" ON public.codex_skills FOR SELECT TO public USING (true);

-- codex_species
ALTER TABLE public.codex_species ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex species" ON public.codex_species;
CREATE POLICY "Anyone can read codex species" ON public.codex_species FOR SELECT TO public USING (true);

-- codex_traits
ALTER TABLE public.codex_traits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex traits" ON public.codex_traits;
CREATE POLICY "Anyone can read codex traits" ON public.codex_traits FOR SELECT TO public USING (true);

-- codex_parts
ALTER TABLE public.codex_parts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex parts" ON public.codex_parts;
CREATE POLICY "Anyone can read codex parts" ON public.codex_parts FOR SELECT TO public USING (true);

-- codex_properties
ALTER TABLE public.codex_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex properties" ON public.codex_properties;
CREATE POLICY "Anyone can read codex properties" ON public.codex_properties FOR SELECT TO public USING (true);

-- codex_equipment
ALTER TABLE public.codex_equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex equipment" ON public.codex_equipment;
CREATE POLICY "Anyone can read codex equipment" ON public.codex_equipment FOR SELECT TO public USING (true);

-- codex_archetypes
ALTER TABLE public.codex_archetypes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex archetypes" ON public.codex_archetypes;
CREATE POLICY "Anyone can read codex archetypes" ON public.codex_archetypes FOR SELECT TO public USING (true);

-- codex_creature_feats
ALTER TABLE public.codex_creature_feats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read codex creature feats" ON public.codex_creature_feats;
CREATE POLICY "Anyone can read codex creature feats" ON public.codex_creature_feats FOR SELECT TO public USING (true);

-- core_rules
ALTER TABLE public.core_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read core rules" ON public.core_rules;
CREATE POLICY "Anyone can read core rules" ON public.core_rules FOR SELECT TO public USING (true);
